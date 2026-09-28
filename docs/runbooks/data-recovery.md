# Data Recovery Runbook

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose / When to Use

Use this runbook after accidental or malicious deletion, corruption, or destructive modification of production data in Amazon RDS or Amazon S3, an AWS Availability Zone or Region disruption, or loss of the production AWS account. Use it with the [Incident Response Plan](../incident-management/incident-response-plan.md), even when the cause appears accidental.

The objectives are to stop further loss, preserve evidence, choose a known-good recovery point, restore into an isolated target, validate it, and only then perform an approved cutover.

**Never restore over the affected production database or object first. Never treat a read replica as a backup:** valid deletes and corruption can replicate to it.

**For RDS data loss, native RDS automated backup / point-in-time restore (PITR) is the first-line recovery mechanism.** Use the S3 logical dumps only as the second line when PITR cannot meet the selected recovery point, an independent logical restore is required, or the primary Region is unavailable.

## Approval Boundary

The inspection commands in this runbook are read-only. Commands marked **CHANGE — approval required** create resources, write objects, or change service routing and require the Incident Response Owner plus the affected System / Data Owner. Suspected malicious activity also requires Security approval after attacker access has been contained.

Do not put database passwords, AWS access keys, connection URLs, customer data, or SQL dumps in tickets, shell history, command output, or this repository. Obtain database credentials from the approved secret store and use protected client configuration files.

## Recovery Resource Map

Treat this table as the resource map for the procedure. Verify every resource and protection setting with the inspection commands below before relying on it.

| Resource | Region | Recovery role / required verification |
| -------- | ------ | ------------------------------------- |
| AWS account alias `logisly` (`900920600269`) | — | Production account; verify the active account and role before every action. Replica account ownership and an independent recovery account remain unverified |
| RDS `production-mariadb-rds-instance` | `ap-southeast-1` | MariaDB source; verify encryption, deletion protection, backup retention, and the PITR window |
| RDS `postgres` | `ap-southeast-1` | PostgreSQL source; verify encryption, deletion protection, backup retention, and the PITR window |
| RDS `production-rds-replica` | `ap-southeast-1` | MariaDB read replica; **availability only, not recovery protection** |
| S3 `logisly-backup` | `ap-southeast-1` | Canonical logical database-backup bucket; verify versioning, Object Lock, encryption, lifecycle, and replication |
| S3 `logisly-backup-replica` | `ap-northeast-1` | Cross-region database-backup destination; verify the selected object version and retention |
| S3 `logisly` | `ap-southeast-1` | Primary application-object bucket; verify versioning, Object Lock, encryption, and replication scope |
| S3 `logisly-replica` | `ap-northeast-1` | Cross-region destination for the configured application-object replication scope |

Logical backup key patterns in `logisly-backup`:

| Data | Key pattern |
| ---- | ----------- |
| Production MariaDB | `backup/logisly/YYYY/MM/DD/HH-MM-SS.sql.zstd` |
| CRM PostgreSQL | `backup/postgres/crm/YYYY/MM/DD/HH-MM-SS.sql.zstd` |
| CRM Ticketing PostgreSQL | `backup/postgres/crm_ticketing/YYYY/MM/DD/HH-MM-SS.sql.zstd` |
| Datalake MariaDB | `backup/datalake/logisly/YYYY/MM/DD/{structure,data}.sql.zstd` |
| MariaDB audit trail | `backup/logisly_audit_trail/YYYY/MM/DD/HH-MM-SS.sql.zstd` |

Do not select similarly named buckets such as `logisly-rds-backup`, `logisly-rds-backup-replica`, or `logisly-rds-snapshot` by name alone. This SOP designates `logisly-backup` as the canonical logical backup bucket. Use another bucket only when the selected object is dated, integrity-checked, and restored successfully into a disposable target.

## 1. Declare and Contain

- [ ] Open an [incident report](../templates/incident-report.md) and [timeline](../templates/incident-timeline.md).
- [ ] Record the affected service, database / bucket / key prefix, discovery time, last known-good time, reporter, and observed business impact.
- [ ] Stop the job, deployment, credential, or user causing continued deletion. Preserve its logs and configuration before removal when safe.
- [ ] If malicious activity is possible, disable or restrict the compromised identity, revoke sessions, rotate exposed credentials, and follow [Compromised Account](compromised-account.md) and [Cloud Security Incident](cloud-security-incident.md).
- [ ] Pause cleanup, lifecycle, migration, and bulk-write jobs affecting the recovery scope. Do **not** disable backup or replication globally without approval.
- [ ] Freeze application writes only when continued writes would make reconciliation unsafe; record who approved the outage.
- [ ] Use UTC for recovery timestamps. Record the Jakarta time and its UTC conversion in the timeline.

## 2. Establish AWS Identity and Variables

Use a role with read-only access for inspection. Elevate only for the approved recovery action.

```bash
export AWS_PROFILE=default
export AWS_REGION=ap-southeast-1
export RECOVERY_REGION=ap-northeast-1
export INCIDENT_ID='INC-YYYY-NNN'

aws sts get-caller-identity --profile "$AWS_PROFILE"
aws configure get region --profile "$AWS_PROFILE"
```

For production-account recovery, stop if the account is not `900920600269` or the expected role is not active. For account-loss recovery, use a separately approved recovery account and record its account ID, role, and authorization; the production-account check cannot be used there. Do not continue with guessed resource names.

## 3. Inventory and Preserve Evidence

### RDS

```bash
aws rds describe-db-instances \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --query 'DBInstances[].{Id:DBInstanceIdentifier,Engine:Engine,Version:EngineVersion,Status:DBInstanceStatus,Retention:BackupRetentionPeriod,Earliest:EarliestRestorableTime,Latest:LatestRestorableTime,Source:ReadReplicaSourceDBInstanceIdentifier,DeletionProtection:DeletionProtection}'

aws rds describe-db-snapshots \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --query 'DBSnapshots[].{Id:DBSnapshotIdentifier,DB:DBInstanceIdentifier,Created:SnapshotCreateTime,Status:Status,Encrypted:Encrypted}'

aws rds describe-events \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --source-type db-instance --duration 10080
```

For malicious or unexplained deletion, preserve relevant CloudTrail event results. CloudTrail Event History covers management events; S3 object-level events are available only if data-event logging was configured.

```bash
aws cloudtrail lookup-events \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue="$SOURCE_DB" \
  --start-time "$START_TIME_UTC" --end-time "$END_TIME_UTC"
```

An evidence snapshot can preserve the affected database state, but it costs money and is a write operation:

```bash
# CHANGE — approval required
aws rds create-db-snapshot \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --db-instance-identifier "$SOURCE_DB" \
  --db-snapshot-identifier "$SOURCE_DB-$INCIDENT_ID-affected"
```

### S3 and logical database backups

```bash
aws s3api get-bucket-versioning --profile "$AWS_PROFILE" --bucket "$BUCKET"
aws s3api get-bucket-replication --profile "$AWS_PROFILE" --bucket "$BUCKET"
aws s3api get-object-lock-configuration --profile "$AWS_PROFILE" --bucket "$BUCKET"

aws s3api list-object-versions \
  --profile "$AWS_PROFILE" --bucket "$BUCKET" --prefix "$KEY"

aws s3api head-object \
  --profile "$AWS_PROFILE" --bucket "$BUCKET" --key "$KEY" \
  ${VERSION_ID:+--version-id "$VERSION_ID"}
```

For the backup site, list recent objects and compare the exact key in both regions:

```bash
aws s3api list-objects-v2 \
  --profile "$AWS_PROFILE" --region ap-southeast-1 \
  --bucket logisly-backup --prefix "$BACKUP_PREFIX" \
  --query 'reverse(sort_by(Contents,&LastModified))[:20].[LastModified,Size,StorageClass,Key]'

aws s3api head-object \
  --profile "$AWS_PROFILE" --region ap-southeast-1 \
  --bucket logisly-backup --key "$BACKUP_KEY"

aws s3api head-object \
  --profile "$AWS_PROFILE" --region ap-northeast-1 \
  --bucket logisly-backup-replica --key "$BACKUP_KEY"
```

When the source is reachable, check source `ReplicationStatus=COMPLETED`; check destination `ReplicationStatus=REPLICA` where available. List destination versions and select the corresponding key, content, and time; **source and replica version IDs are independent and need not match**. Compare size, checksums where available, retention, and storage class. Metadata alone does not prove SQL integrity or restorability.

## 4. Choose the Recovery Path

For an RDS incident, evaluate the paths in this order and record why a higher-priority path was rejected:

1. **RDS automated backup / PITR — first line.** It provides the closest recoverable time inside the native retention window and restores to a new instance.
2. **Canonical logical dump in `logisly-backup` — second line.** Use for recovery outside PITR, logical/partial recovery, or independent validation.
3. **Cross-region logical dump in `logisly-backup-replica` — last-resort copy.** Use when the primary backup bucket or Region is unavailable or untrusted.

| Situation | Preferred path |
| --------- | -------------- |
| RDS row/table/database deletion within the native retention window | **First line:** RDS point-in-time restore to a **new** DB instance just before the destructive event |
| RDS PITR window unavailable or an independent logical copy is required | Restore a selected `logisly-backup` SQL archive to a **new** database |
| Entire RDS DB instance deleted | **First line:** restore from a retained native automated backup; otherwise use the final/manual snapshot, then the canonical logical dump |
| Primary backup bucket unavailable | Use the same key/version from `logisly-backup-replica` in Tokyo |
| S3 object hidden by a delete marker or overwritten | Recover an earlier version to a quarantine/recovery key, validate, then publish a new current version |
| Primary S3 object version permanently deleted | Recover the matching replica version if present and retained |
| Entire S3 bucket deleted | Recreate a hardened replacement through the approved infrastructure path and copy recoverable data from the independent Tokyo replica |
| Availability Zone downtime, data intact | Follow section 5D: verify affected components and their actual multi-AZ failover; move single-AZ components through the approved deployment path |
| Availability Zone data loss | Follow section 5D: assess whether data is recoverable in another AZ, then restore the last known-good point to an isolated target |
| Region downtime, data intact or status unknown | Follow section 5E: assess whether waiting or a Tokyo recovery is safer; fail over only with an approved recovery environment |
| Region data loss | Follow section 5E: restore from a verified independent Tokyo copy; record uncovered scope and accepted data gap |
| Entire AWS account closed, deleted, or inaccessible | Follow section 5F: escalate to AWS Support immediately and inventory copies controlled by another account; same-account replicas are not an account-loss recovery path |

Select a recovery point before the destructive event but after the last required valid transaction. If timing is uncertain, restore multiple candidates into isolated targets and let the Data Owner compare them.

## 5A. Recover Amazon RDS by Point in Time

This is the default and first-line database recovery procedure. Do not skip it merely because a logical dump exists; first confirm whether the required recovery point is within the native RDS automated-backup window.

Record the exact source configuration before creating the target:

```bash
export SOURCE_DB='production-mariadb-rds-instance' # or postgres
export RESTORE_TIME='YYYY-MM-DDTHH:MM:SSZ'
export TARGET_DB="recovery-${INCIDENT_ID,,}"

aws rds describe-db-instances \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --db-instance-identifier "$SOURCE_DB"
```

Confirm `RESTORE_TIME` is inside `EarliestRestorableTime` and `LatestRestorableTime`. Reuse the approved subnet group, security groups, parameter group, option group, instance class, encryption key, and storage settings from the source. Keep the target private and restrict inbound access to recovery operators and validators.

```bash
# CHANGE — approval required; fill values from the source inventory
aws rds restore-db-instance-to-point-in-time \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --source-db-instance-identifier "$SOURCE_DB" \
  --target-db-instance-identifier "$TARGET_DB" \
  --restore-time "$RESTORE_TIME" \
  --db-instance-class "$DB_INSTANCE_CLASS" \
  --db-subnet-group-name "$DB_SUBNET_GROUP" \
  --vpc-security-group-ids $VPC_SECURITY_GROUP_IDS \
  --no-publicly-accessible \
  --deletion-protection \
  --tags Key=IncidentId,Value="$INCIDENT_ID" Key=Purpose,Value=data-recovery

aws rds wait db-instance-available \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --db-instance-identifier "$TARGET_DB"
```

Do not point applications at the target yet. Validate engine/version, parameter and option groups, encryption, network isolation, row counts, required records, referential integrity, application migrations, and application read tests. For partial loss, export only the approved rows/tables from this recovered target and merge them through a reviewed script or transaction; do not replace the whole production database unnecessarily.

### If the entire RDS instance was deleted

Native RDS backup is still the first line **only when automated backups were retained during deletion**. `describe-db-instances` will no longer return the instance; inspect retained automated backups by status instead. Do not filter only by the old DB identifier because AWS CLI requires that identifier to belong to an existing instance.

```bash
aws rds describe-db-instance-automated-backups \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --filters Name=status,Values=retained \
  --query 'DBInstanceAutomatedBackups[].{DB:DBInstanceIdentifier,ResourceId:DbiResourceId,Arn:DBInstanceAutomatedBackupsArn,Status:Status,Earliest:RestoreWindow.EarliestTime,Latest:RestoreWindow.LatestTime,Encrypted:Encrypted}'
```

Match the deleted instance using the recorded immutable `DbiResourceId`, old ARN, engine, deletion time, and incident evidence. If a retained backup exists, use its `DBInstanceAutomatedBackupsArn` for native PITR:

```bash
export AUTOMATED_BACKUP_ARN='arn:aws:rds:...:auto-backup:...'

# CHANGE — approval required; native RDS automated backup remains first line
aws rds restore-db-instance-to-point-in-time \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --source-db-instance-automated-backups-arn "$AUTOMATED_BACKUP_ARN" \
  --target-db-instance-identifier "$TARGET_DB" \
  --restore-time "$RESTORE_TIME" \
  --db-instance-class "$DB_INSTANCE_CLASS" \
  --db-subnet-group-name "$DB_SUBNET_GROUP" \
  --vpc-security-group-ids $VPC_SECURITY_GROUP_IDS \
  --no-publicly-accessible \
  --deletion-protection \
  --tags Key=IncidentId,Value="$INCIDENT_ID" Key=Purpose,Value=data-recovery
```

If no retained automated backup exists, list available final/manual snapshots and restore the newest known-good one to a new instance. A final snapshot may be newer than the last safe state after malicious deletion, so validate its creation time against the incident timeline.

```bash
aws rds describe-db-snapshots \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --snapshot-type manual \
  --query 'reverse(sort_by(DBSnapshots,&SnapshotCreateTime))[].{Id:DBSnapshotIdentifier,DB:DBInstanceIdentifier,Created:SnapshotCreateTime,Status:Status,Encrypted:Encrypted}'

# CHANGE — approval required; second native path when retained PITR is absent
aws rds restore-db-instance-from-db-snapshot \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --db-instance-identifier "$TARGET_DB" \
  --db-instance-class "$DB_INSTANCE_CLASS" \
  --db-subnet-group-name "$DB_SUBNET_GROUP" \
  --vpc-security-group-ids $VPC_SECURITY_GROUP_IDS \
  --no-publicly-accessible \
  --deletion-protection \
  --tags Key=IncidentId,Value="$INCIDENT_ID" Key=Purpose,Value=data-recovery
```

If neither native path exists or contains a safe recovery point, continue with the canonical S3 logical backup in section 5B. Record the missing retained backup as a control failure. For future planned deletion, require the AWS CLI `--no-delete-automated-backups` option and a final snapshot; never run a DB deletion command from this incident runbook.

## 5B. Recover a Logical Database Backup from S3

Choose the exact object version. Prefer `logisly-backup`; use `logisly-backup-replica` when the source is unavailable or untrusted.

```bash
export BACKUP_BUCKET=logisly-backup
export BACKUP_REGION=ap-southeast-1
export BACKUP_KEY='backup/logisly/YYYY/MM/DD/HH-MM-SS.sql.zstd'
export BACKUP_VERSION_ID='exact-version-id'
umask 077
export RECOVERY_DIR="$(mktemp -d /tmp/logisly-recovery.XXXXXX)"

aws s3api get-object \
  --profile "$AWS_PROFILE" --region "$BACKUP_REGION" \
  --bucket "$BACKUP_BUCKET" --key "$BACKUP_KEY" \
  --version-id "$BACKUP_VERSION_ID" \
  "$RECOVERY_DIR/database.sql.zstd"

zstd --test "$RECOVERY_DIR/database.sql.zstd"
```

`GLACIER_IR` (Glacier Instant Retrieval) can be downloaded immediately. `DEEP_ARCHIVE` or Glacier Flexible Retrieval requires an approved `restore-object` request and a wait until `Restore` no longer reports `ongoing-request="true"`:

```bash
# CHANGE — approval required; only for an archived version that is not immediately readable
aws s3api restore-object \
  --profile "$AWS_PROFILE" --region "$BACKUP_REGION" \
  --bucket "$BACKUP_BUCKET" --key "$BACKUP_KEY" \
  --version-id "$BACKUP_VERSION_ID" \
  --restore-request '{"Days":7,"GlacierJobParameters":{"Tier":"Standard"}}'
```

Restore only into a new, empty, isolated database. Use a mode-`0600` MariaDB option file (`DB_CLIENT_CONFIG`) or PostgreSQL password file (`PGPASSFILE`) populated from the approved secret store; never place the password in the command.

```bash
set -o pipefail # fail the restore if decompression fails

# CHANGE — approval required; MariaDB archive
zstd -dc "$RECOVERY_DIR/database.sql.zstd" | \
  mariadb --defaults-extra-file="$DB_CLIENT_CONFIG" "$TARGET_DATABASE"

# CHANGE — approval required; PostgreSQL archive
zstd -dc "$RECOVERY_DIR/database.sql.zstd" | \
  PGPASSFILE="$PGPASSFILE" psql \
    --host "$TARGET_HOST" --port 5432 --username "$TARGET_USER" \
    --dbname "$TARGET_DATABASE" --set ON_ERROR_STOP=1
```

The `db-backup` application also has `restore-from-file`, but it is destructive, MariaDB-only, and recreates its configured target without a confirmation prompt or automatic pre-restore snapshot. Use it only when its target configuration has been independently verified as disposable.

## 5C. Recover Deleted or Overwritten S3 Data

First list all versions and delete markers for the exact key. Record the selected `VersionId` and verify it with `head-object`.

```bash
aws s3api list-object-versions \
  --profile "$AWS_PROFILE" --bucket "$BUCKET" --prefix "$KEY"

aws s3api head-object \
  --profile "$AWS_PROFILE" --bucket "$BUCKET" --key "$KEY" \
  --version-id "$GOOD_VERSION_ID"
```

Recover to a separate key first. URL-encode special characters in `KEY` when constructing `--copy-source`.

```bash
export RECOVERY_KEY="recovery/$INCIDENT_ID/$KEY"

# CHANGE — approval required; creates a new object version without deleting history
aws s3api copy-object \
  --profile "$AWS_PROFILE" --bucket "$BUCKET" \
  --copy-source "$BUCKET/$KEY?versionId=$GOOD_VERSION_ID" \
  --key "$RECOVERY_KEY" \
  --metadata-directive COPY

aws s3api head-object \
  --profile "$AWS_PROFILE" --bucket "$BUCKET" --key "$RECOVERY_KEY"
```

After the Data Owner validates size, content type, encryption, checksum where present, and application behavior, copy the known-good version to the original key to create a new current version:

```bash
# CHANGE — approval required; application-visible recovery
aws s3api copy-object \
  --profile "$AWS_PROFILE" --bucket "$BUCKET" \
  --copy-source "$BUCKET/$KEY?versionId=$GOOD_VERSION_ID" \
  --key "$KEY" \
  --metadata-directive COPY
```

Do not delete the delete marker or bad version during incident recovery. Keeping it preserves history and makes rollback easier. Object Lock may prohibit deletion in any case.

If the primary version is permanently absent, inspect the same key in `logisly-replica` (for `logisly/live/`) or `logisly-backup-replica` (for database backups), download the exact replica version, validate it locally, and upload it as a new version to the approved primary recovery key.

### If the entire S3 bucket was deleted

A deleted bucket and its configuration cannot be restored in place. Treat the bucket name as untrusted until AWS confirms it is available; do not repeatedly recreate it during investigation. Preserve CloudTrail evidence for bucket-policy changes, object/version deletion, replication changes, and `DeleteBucket`.

First establish the surviving scope in the independent replica:

```bash
export REPLICA_BUCKET=logisly-replica        # application data
export REPLICA_REGION=ap-northeast-1

aws s3api head-bucket \
  --profile "$AWS_PROFILE" --region "$REPLICA_REGION" \
  --bucket "$REPLICA_BUCKET"

aws s3api list-objects-v2 \
  --profile "$AWS_PROFILE" --region "$REPLICA_REGION" \
  --bucket "$REPLICA_BUCKET" --delimiter / \
  --query '{Prefixes:CommonPrefixes[].Prefix,Objects:Contents[].Key}'

aws s3api get-bucket-versioning --profile "$AWS_PROFILE" --bucket "$REPLICA_BUCKET"
aws s3api get-object-lock-configuration --profile "$AWS_PROFILE" --bucket "$REPLICA_BUCKET"
```

For deletion of `logisly-backup`, set `REPLICA_BUCKET=logisly-backup-replica`. For deletion of `logisly`, this SOP assumes replica coverage only for the `live/` prefix. **Never assume other prefixes or top-level objects are recoverable without verifying them in the replica.** Locate another authoritative copy or record the data loss for unreplicated scope.

Create the replacement using the reviewed infrastructure configuration whenever available. If emergency CLI creation is approved, use a new incident-specific name first, enable Object Lock at creation time, keep Bucket Owner Enforced ownership, block all public access, and apply encryption, Object Lock retention, lifecycle, policy, logging/CloudTrail, tags, and replication before application cutover.

```bash
export RECOVERY_BUCKET="logisly-recovery-${INCIDENT_ID,,}"
export RECOVERY_RETENTION_DAYS=1825 # 1825 for application replica; 180 for DB backup; confirm before use

# CHANGE — approval required; use approved IaC instead when available
aws s3api create-bucket \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --bucket "$RECOVERY_BUCKET" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION" \
  --object-lock-enabled-for-bucket \
  --object-ownership BucketOwnerEnforced

# CHANGE — approval required
aws s3api put-public-access-block \
  --profile "$AWS_PROFILE" --bucket "$RECOVERY_BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# CHANGE — approval required; latest object versions only
aws s3api put-bucket-encryption \
  --profile "$AWS_PROFILE" --bucket "$RECOVERY_BUCKET" \
  --server-side-encryption-configuration \
  'Rules=[{ApplyServerSideEncryptionByDefault={SSEAlgorithm=AES256}}]'

# CHANGE — approval required; configure retention before copying any object
aws s3api put-object-lock-configuration \
  --profile "$AWS_PROFILE" --bucket "$RECOVERY_BUCKET" \
  --object-lock-configuration \
  "ObjectLockEnabled=Enabled,Rule={DefaultRetention={Mode=COMPLIANCE,Days=$RECOVERY_RETENTION_DAYS}}"

# CHANGE — approval required; latest object versions only
aws s3 sync "s3://$REPLICA_BUCKET" "s3://$RECOVERY_BUCKET" \
  --profile "$AWS_PROFILE" \
  --source-region "$REPLICA_REGION" --region "$AWS_REGION" \
  --only-show-errors
```

`aws s3 sync` restores only the latest versions; it does not reconstruct full version history, delete markers, Object Lock retention, or the deleted bucket configuration. If historical versions are required, inventory them with `list-object-versions` and use a separately reviewed S3 Batch Operations/version-copy plan. Do not modify or repurpose the replica bucket itself as production.

Validate counts and representative objects in the replacement, configure a new independent replica, update application configuration through the normal deployment/change process, and run a post-cutover backup/replication test before declaring recovery complete.

## 5D. Availability Zone Downtime or Data Loss

First identify the affected AZ and each service's actual placement; a read replica is not an automatic failover target. Inspect RDS `MultiAZ`, `AvailabilityZone`, `SecondaryAvailabilityZone`, status, and events, plus the workload and storage placement from the approved infrastructure inventory. Do not assume every database, compute node, volume, or storage class spans AZs.

- **Downtime, data intact:** For an RDS Multi-AZ deployment, allow and verify its automatic failover, then test application connections and writes. For a single-AZ database or workload, use the approved restore or redeployment path in a healthy AZ; a replacement still needs private networking, secrets, capacity, and application validation. Do not start a second writable database while the original could return.
- **Data loss or corruption:** Stop destructive writes and establish the last known-good time. Multi-AZ failover does not undo replicated deletion or corruption. Use section 5A for RDS PITR, section 5B for a verified logical dump if needed, and section 5C for S3 version recovery. Restore to an isolated target, validate, reconcile later writes, and obtain cutover approval under section 6.
- **S3 scope:** Check the affected objects' storage classes and exact versions. Standard multi-AZ S3 classes are designed to tolerate an AZ failure; One Zone classes are not. A missing object or damaged version is a data-loss incident regardless of whether other objects remain readable.

If the healthy AZ cannot host the service or regional control-plane operations are impaired, evaluate section 5E. Record whether this was availability loss, permanent data loss, or both.

## 5E. Region Downtime or Data Loss

Determine whether `ap-southeast-1` is temporarily unavailable or its data is confirmed lost. Use service health, unaffected-region checks, application probes, and incident evidence; an API timeout alone does not prove deletion. Inventory the exact latest recoverable version/time in `ap-northeast-1`, replication lag, encryption key access, and the replicated prefix scope. The listed Tokyo S3 buckets provide **data copies only**; they do not establish a working database, compute, network, identity, or application failover site.

- **Downtime, source data believed intact:** Decide with the Incident Response Owner and System / Data Owner whether to wait or activate an approved Tokyo environment, considering the outage duration, RTO, data gap, and split-brain risk. Freeze or fence writes to the old primary before accepting writes in a replacement. If there is no verified recovery environment, report the service as unavailable; do not declare failover complete from S3 object presence.
- **Confirmed Region data loss:** Select verified Tokyo object versions for each required data set. For databases, restore the logical dump through section 5B into a new isolated database in the recovery Region; use cross-Region RDS automated backups or snapshots only if their presence, restore window, KMS access, and restore procedure were verified. For application objects, use section 5C or an approved bucket-rebuild plan. Reconcile missing transactions and unreplicated S3 prefixes with the Data Owner; record irrecoverable data explicitly.
- **Cutover and return:** Provision or verify networking, compute, KMS, IAM, secrets, DNS, and application configuration in the recovery Region; test end-to-end reads and writes before approved routing changes. Keep the old primary fenced when it returns. Plan failback as a separate reviewed change after data reconciliation.

## 5F. Entire Production AWS Account Closed, Deleted, or Inaccessible

Treat a closed account, permanent account deletion, IAM lockout, and mass resource deletion as different states. Escalate immediately to the Incident Response Owner, Security, and AWS Support through an independently controlled identity. If the account was closed, request reopening within AWS's post-closure window; do not promise restoration of individual resources or delay independent recovery while waiting. Preserve Organizations, billing, CloudTrail, and external monitoring evidence available outside the affected account.

1. **Establish a trusted destination.** Verify an approved recovery account's ID, administrative access, billing, guardrails, network, and deployment source. Record who owns its KMS keys and secrets. Never use an account controlled by the suspected attacker.
2. **Inventory independent copies.** From the recovery account, verify the owner account ID and access for each backup vault, S3 bucket, snapshot, and encryption key. The Tokyo buckets listed above have **unverified account ownership**. Cross-Region copies in the lost account, its RDS automated backups, and its KMS keys cannot be assumed usable after account closure or permanent loss. Require an actual read and test restore of a backup whose data and decryption key remain accessible outside that account.
3. **Choose the outcome from evidence.** If the account is reopened and trustworthy, inventory and validate it before using sections 5A–5E. If independently owned copies exist, restore into isolated resources in the recovery account, rebuild infrastructure and identity from reviewed configuration, then follow section 6. If neither path is available, record **no proven recovery path**, the affected data classes, and the business decision; do not claim the Tokyo replicas provide account-level resilience.
4. **Re-establish operations.** Rotate compromised credentials, replace account-bound resource references and KMS dependencies, verify backup jobs write to an independent destination, and perform an end-to-end application restore and cutover test. Treat old account identifiers and DNS routes as untrusted until reviewed.

Account-loss recovery requires a separately owned, accessible copy **and** a usable decryption path. Same-account cross-Region replication helps with Region loss but does not satisfy this requirement.

## 6. Validate, Reconcile, and Cut Over

- [ ] A second operator verifies source, target, timestamp/version, account, and region before any cutover.
- [ ] Database: verify schema, migrations, row counts, required records, integrity constraints, timestamps, and application read/write tests.
- [ ] S3: verify exact key, size, content type, encryption, version, retention, and checksum when available; open or parse a representative recovered object safely.
- [ ] Reconcile writes made after the recovery point. The System / Data Owner approves what is replayed, merged, or intentionally lost.
- [ ] Fix the deletion cause and verify the offending identity/job no longer has destructive access.
- [ ] Obtain cutover approval and record the decision. Update application secret/config/DNS only through the normal deployment/change path.
- [ ] Keep the original affected resource isolated and unchanged until Security and the Data Owner release it.
- [ ] Monitor errors, data consistency, replication, and new backup completion after cutover.
- [ ] Create and restore-test a new post-recovery backup before closure.

Recovery is complete only when the Data Owner signs off on data correctness and the System Owner signs off on service behavior. An AWS resource reaching `available`, a successful `get-object`, or `zstd --test` alone is not recovery proof.

## 7. Evidence and Closure

Retain under the Incident ID:

| Evidence | Required content |
| -------- | ---------------- |
| Timeline | Discovery, destructive event, containment, selected recovery point, restore, validation, cutover |
| AWS identity | Account, role ARN, region; no tokens or keys |
| RDS inventory | Source and target identifiers, PITR window, snapshot/restore API results, configuration comparison |
| S3 inventory | Bucket, key, version IDs, delete markers, size, storage class, replication status, retention |
| Integrity results | `zstd --test`, checksums if present, database/application validation results |
| Decisions | Approvers, rejected recovery points, accepted data gap, cutover and rollback decisions |
| Cause and remediation | Actor/job/root cause, access changes, guardrails, monitoring, follow-up owner and due date |

Run a [Post-Incident Review](../incident-management/post-incident-review.md) for malicious deletion and any High/Critical or materially disruptive recovery.

## Required Controls / To Be Confirmed

- [ ] Formal RPO and RTO per database and S3 data class
- [ ] Named Data Owners and System Owners for each service
- [ ] Scheduled restore-test cadence and retained test evidence
- [ ] CloudTrail S3 data-event coverage and authoritative log-query location
- [ ] Recovery VPC/security group and cross-region compute/network design
- [ ] AZ placement and multi-AZ settings for each production workload and database; single-AZ storage inventory
- [ ] Tokyo recovery environment, DNS/fencing procedure, KMS access, and tested failover/failback
- [ ] Separately owned AWS recovery account and independently readable, decryptable, restore-tested backups for each data class; verify replica bucket owner IDs
- [ ] Account closure escalation route and external copies of infrastructure configuration, secrets recovery procedure, and audit evidence
- [ ] Automated backup freshness, replication-lag, and restore-test alerts
- [ ] Guardrail requiring retained automated backups plus a final snapshot for every approved RDS deletion
- [ ] Retention/ownership decision for legacy `logisly-rds-backup*` and `logisly-rds-snapshot`

## References

- [AWS RDS point-in-time restore API](https://docs.aws.amazon.com/AmazonRDS/latest/APIReference/API_RestoreDBInstanceToPointInTime.html)
- [AWS S3 restoring previous versions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/RestoringPreviousVersions.html)
- [AWS S3 replication status](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-status.html)
- [AWS CLI `restore-object`](https://docs.aws.amazon.com/cli/latest/reference/s3api/restore-object.html)
- [AWS RDS Multi-AZ failover](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html)
- [AWS S3 storage durability by class](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html)
- [AWS account closure and reopening](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-closing.html)
- [AWS Backup cross-account copies](https://docs.aws.amazon.com/aws-backup/latest/devguide/create-cross-account-backup.html)
- [Incident escalation](../incident-management/incident-escalation.md)
- [Incident communications](../incident-management/incident-communications.md)
- [Ransomware runbook](ransomware.md)
