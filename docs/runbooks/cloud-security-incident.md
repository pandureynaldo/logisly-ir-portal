# Cloud Security Incident Runbook

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose / When to Use

Use this runbook for security incidents affecting Logisly workloads, identities, data, or control-plane resources in <!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER --> — **[TO BE CONFIRMED]**. Examples include compromised cloud credentials, misconfigured public storage, unauthorized resource creation, suspicious API activity, or provider-reported events.

### Shared responsibility

Cloud security incidents often span customer-managed and provider-managed layers. Logisly is responsible for its configurations, identities, data, and workloads; <!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER --> is responsible for the underlying cloud platform per their shared responsibility model — **[TO BE CONFIRMED]** for the specific provider and services in use. Escalate to the provider only through approved support/security channels when the issue appears to be platform-side or requires provider action — `[TO BE CONFIRMED]`.

Report via <!-- var:REPORTING_CHANNEL_PRIMARY -->Email devops@logisly.com<!-- /var:REPORTING_CHANNEL_PRIMARY --> or <!-- var:REPORTING_CHANNEL_EMERGENCY -->Telepon/WhatsApp call Lesmana Nugroho; jika tidak terjangkau, telepon Niyoko Yuliawan. Email devops@logisly.com untuk jejak.<!-- /var:REPORTING_CHANNEL_EMERGENCY --> for active control-plane abuse.

---

## Immediate Actions (First ~15 Minutes)

- [ ] Open [incident report](../templates/incident-report.md) and [timeline](../templates/incident-timeline.md)
- [ ] Identify cloud account(s)/subscription(s)/project(s), regions, and services impacted — `[TO BE CONFIRMED]` inventory source
- [ ] Disable or rotate compromised access keys, IAM users/roles, federation trusts, or CI credentials — `[TO BE CONFIRMED]`
- [ ] Revoke suspicious active sessions / temporary credentials
- [ ] Contain obvious exposures (public buckets/objects, open security groups / firewall rules) — `[TO BE CONFIRMED]`
- [ ] Notify <!-- var:IR_PRIMARY_OWNER -->lesmana.nugroho@logisly.com<!-- /var:IR_PRIMARY_OWNER --> / <!-- var:IT_SECURITY_TEAM -->lesmana.nugroho@logisly.com<!-- /var:IT_SECURITY_TEAM -->
- [ ] If ransomware, malware, or data leak indicators exist, engage those runbooks in parallel

---

## Containment

- [ ] Apply deny policies / SCP / org policies to freeze risky actions if approved for emergencies — `[TO BE CONFIRMED]`
- [ ] Isolate impacted VPC/network segments or workloads — `[TO BE CONFIRMED]`
- [ ] Stop or snapshot unauthorized compute resources for investigation before deletion when feasible
- [ ] Block malicious IPs at cloud WAF/firewall/security groups — `[TO BE CONFIRMED]`
- [ ] Restrict IAM to break-glass responders during active incidents — `[TODO]`
- [ ] Engage <!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER --> support/security if platform compromise or provider coordination is required — `[TO BE CONFIRMED]`

---

## Investigation Pointers

- Cloud audit / API logs for unauthorized actions (IAM changes, data access, networking, billing anomalies) — `[TO BE CONFIRMED]` log services
- Identity source: long-lived keys, SSO/federation, workload identity, CI/CD roles
- Resource inventory drift: new users, keys, functions, instances, storage, DNS
- Data access paths suggesting [data-leak.md](data-leak.md)
- Shared responsibility boundary: customer misconfig vs. provider incident
- Linked local/endpoint compromise feeding cloud access ([compromised-account.md](compromised-account.md), [malware.md](malware.md))

---

## Eradication / Recovery

- [ ] Remove unauthorized resources and persistence (roles, keys, lambdas/functions, images, backdoors)
- [ ] Restore secure baseline IaC / configuration from known-good definitions — `[TO BE CONFIRMED]`
- [ ] Rotate all secrets in blast radius; invalidate temporary credentials
- [ ] Re-enable services with least privilege and verified networking posture
- [ ] Validate logging, monitoring, and guardrails are intact — `[TODO]`
- [ ] Confirm with <!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER --> any required provider-side closure actions — `[TO BE CONFIRMED]`

---

## Evidence to Collect

| Evidence | Location / ID | Notes |
| -------- | ------------- | ----- |
| Cloud audit / API log exports | `[TODO]` | Account/project IDs, time window |
| IAM / access-key change history | `[TODO]` | |
| Resource inventory before/after | `[TODO]` | |
| Network / WAF / storage access logs | `[TODO]` | |
| Provider ticket / case IDs | `[TODO]` | <!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER --> |
| Incident report and timeline | Templates below | |

Do not commit cloud secret material into repositories or evidence indexes.

---

## Escalation

Follow [../incident-management/incident-escalation.md](../incident-management/incident-escalation.md). Escalate for production account compromise, customer-data exposure, cryptomining/ransom in cloud, or need for provider engagement / external IR — `[TO BE CONFIRMED]`.

---

## Communications

Use [../incident-management/incident-communications.md](../incident-management/incident-communications.md) and [../templates/incident-communication.md](../templates/incident-communication.md). Align provider-facing and customer-facing statements with authorized approvers.

---

## Related Templates

- [../templates/incident-report.md](../templates/incident-report.md)
- [../templates/incident-timeline.md](../templates/incident-timeline.md)
- [../templates/incident-postmortem.md](../templates/incident-postmortem.md)
- [../templates/incident-communication.md](../templates/incident-communication.md)
- [../templates/risk-acceptance.md](../templates/risk-acceptance.md) — for temporary cloud control exceptions

---

## Gap / To Be Confirmed

- [ ] Playbook owner
- [ ] Identity of <!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER --> and in-scope accounts/subscriptions/projects
- [ ] Shared responsibility contacts and provider security reporting channel
- [ ] Cloud IAM break-glass and key rotation procedures
- [ ] Audit log locations, retention, and export process
- [ ] IaC / configuration baseline source of truth
