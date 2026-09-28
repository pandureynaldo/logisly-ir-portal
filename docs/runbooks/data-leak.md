# Data Leak Runbook

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose / When to Use

Use this runbook for suspected or confirmed unauthorized disclosure, exposure, or exfiltration of Logisly data — including misconfigured public sharing, lost/stolen media, unauthorized cloud/object exposure, email/misdirected sends with sensitive data, or attacker-driven theft.

Report via <!-- var:REPORTING_CHANNEL_PRIMARY -->Email devops@logisly.com<!-- /var:REPORTING_CHANNEL_PRIMARY --> or <!-- var:REPORTING_CHANNEL_EMERGENCY -->Telepon/WhatsApp call Lesmana Nugroho; jika tidak terjangkau, telepon Niyoko Yuliawan. Email devops@logisly.com untuk jejak.<!-- /var:REPORTING_CHANNEL_EMERGENCY --> when sensitive or large-scale data is involved.

---

## Immediate Actions (First ~15 Minutes)

- [ ] Open [incident report](../templates/incident-report.md) and [timeline](../templates/incident-timeline.md)
- [ ] Identify data type, volume (if known), systems involved, and exposure path
- [ ] Stop ongoing exposure: revoke public links, close open shares, disable leaking integrations, isolate compromised hosts/accounts — `[TO BE CONFIRMED]`
- [ ] Preserve evidence of exposure (URLs, access logs, screenshots) before changing settings where possible
- [ ] Notify <!-- var:IR_PRIMARY_OWNER -->lesmana.nugroho@logisly.com<!-- /var:IR_PRIMARY_OWNER --> / <!-- var:IT_SECURITY_TEAM -->lesmana.nugroho@logisly.com<!-- /var:IT_SECURITY_TEAM -->
- [ ] If associated with account takeover, malware, or cloud misconfiguration, engage the related runbook in parallel

---

## Containment

- [ ] Remove public/unauthorized access to the data source
- [ ] Rotate credentials, keys, and tokens that could enable continued access
- [ ] Suspend compromised identities ([compromised-account.md](compromised-account.md))
- [ ] Request takedown of externally posted copies via approved process — `[TO BE CONFIRMED]`
- [ ] Block exfil channels/IOCs if attacker-driven — `[TO BE CONFIRMED]`
- [ ] Preserve copies of exposed datasets for scoping (access-controlled) — `[TODO]`

---

## Investigation Pointers

- What data elements were exposed (categories, sensitivity, personal data indicators) — `[TO BE CONFIRMED]` classification scheme
- Who accessed the data during the exposure window (access logs, CDN, cloud access logs)
- How exposure occurred (misconfig, insider, attacker, vendor, lost device)
- Whether data left Logisly control and to which destinations
- Legal/regulatory notification triggers — involve Legal/Compliance per escalation; do not self-notify externally without authority — `[TO BE CONFIRMED]`
- Related systems and copies (backups, replicas, exports, BI extracts)

---

## Eradication / Recovery

- [ ] Confirm exposure path closed and verified with follow-up checks — `[TODO]`
- [ ] Remediate root cause (permissions, DLP policy, process gap) — `[TO BE CONFIRMED]`
- [ ] Rotate secrets contained in leaked material
- [ ] Support Legal/Compliance on notification obligations if any — `[TO BE CONFIRMED]`
- [ ] Monitor for reuse of leaked data (credential stuffing, fraud) — `[TODO]`
- [ ] Close only after scoping and containment verification documented

---

## Evidence to Collect

| Evidence | Location / ID | Notes |
| -------- | ------------- | ----- |
| Exposure path description / screenshots | `[TODO]` | Redact unnecessary sensitive values in working copies |
| Access / download logs for exposure window | `[TODO]` | |
| Data inventory / categories affected | `[TODO]` | |
| Revocation / permission-change records | `[TODO]` | |
| Takedown requests / responses | `[TODO]` | |
| Legal/Compliance decision notes | `[TODO]` | |
| Incident report and timeline | Templates below | |

Minimize duplication of sensitive payloads in tickets and repos.

---

## Escalation

Follow [../incident-management/incident-escalation.md](../incident-management/incident-escalation.md). Escalate early when personal data, customer data, regulated data, or large-scale exposure is possible. External notifications require <!-- var:EXTERNAL_NOTIFICATION_AUTHORITY -->winsen.santoso@logisly.com<!-- /var:EXTERNAL_NOTIFICATION_AUTHORITY --> / approved authority — `[TO BE CONFIRMED]`.

---

## Communications

Use [../incident-management/incident-communications.md](../incident-management/incident-communications.md) and [../templates/incident-communication.md](../templates/incident-communication.md). Align all external messaging with Legal/Compliance and authorized approvers.

---

## Related Templates

- [../templates/incident-report.md](../templates/incident-report.md)
- [../templates/incident-timeline.md](../templates/incident-timeline.md)
- [../templates/incident-postmortem.md](../templates/incident-postmortem.md)
- [../templates/incident-communication.md](../templates/incident-communication.md)
- [../templates/risk-acceptance.md](../templates/risk-acceptance.md) — if residual exposure risk is accepted temporarily

---

## Gap / To Be Confirmed

- [ ] Playbook owner
- [ ] Data classification scheme and DLP tooling
- [ ] Cloud/SaaS permission and access-log sources
- [ ] Legal/regulatory notification criteria and owners
- [ ] External takedown process
