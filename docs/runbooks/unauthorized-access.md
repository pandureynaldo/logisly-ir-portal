# Unauthorized Access Runbook

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose / When to Use

Use this runbook when unauthorized access to Logisly systems, applications, data, or facilities is suspected or confirmed — including forced entry into accounts/systems without known credential theft playbook overlap, privilege abuse beyond entitlement, broken access control exploitation, or physical/logical access violations.

If the primary issue is account takeover, start with [compromised-account.md](compromised-account.md). If cloud control-plane abuse is primary, also use [cloud-security-incident.md](cloud-security-incident.md).

Report via <!-- var:REPORTING_CHANNEL_PRIMARY -->Email devops@logisly.com<!-- /var:REPORTING_CHANNEL_PRIMARY --> or <!-- var:REPORTING_CHANNEL_EMERGENCY -->Telepon/WhatsApp call Lesmana Nugroho; jika tidak terjangkau, telepon Niyoko Yuliawan. Email devops@logisly.com untuk jejak.<!-- /var:REPORTING_CHANNEL_EMERGENCY --> for active intrusions.

---

## Immediate Actions (First ~15 Minutes)

- [ ] Open [incident report](../templates/incident-report.md) and [timeline](../templates/incident-timeline.md)
- [ ] Identify target system(s), access path, and whether access is still active
- [ ] Terminate active unauthorized sessions / connections — `[TO BE CONFIRMED]`
- [ ] Disable implicated accounts or keys; rotate exposed secrets
- [ ] Isolate affected hosts or restrict network paths if intrusion is ongoing
- [ ] Notify <!-- var:IR_PRIMARY_OWNER -->lesmana.nugroho@logisly.com<!-- /var:IR_PRIMARY_OWNER --> / <!-- var:IT_SECURITY_TEAM -->lesmana.nugroho@logisly.com<!-- /var:IT_SECURITY_TEAM -->
- [ ] Preserve relevant logs before rollover if retention is short — `[TO BE CONFIRMED]`

---

## Containment

- [ ] Block attacker source IPs/ASNs/geos if appropriate and approved — `[TO BE CONFIRMED]`
- [ ] Patch or disable the vulnerable entry point if known (VPN, exposed service, misconfig)
- [ ] Enforce least privilege; remove excessive entitlements discovered during response
- [ ] Increase monitoring on target systems — `[TODO]`
- [ ] For physical access indicators, secure the location and involve approved facilities/security contacts — `[TO BE CONFIRMED]`

---

## Investigation Pointers

- Authentication, authorization, and application audit logs for the access window
- Whether access used stolen credentials, vulnerability exploit, insider path, or misconfiguration
- Actions performed: data read/export, configuration change, persistence, privilege escalation
- Scope of systems reachable from the entry point
- Correlation with phishing, malware, or prior vulnerabilities — `[TODO]`
- Business impact: integrity, availability, confidentiality

---

## Eradication / Recovery

- [ ] Remove attacker persistence (accounts, keys, web shells, scheduled jobs, backdoors)
- [ ] Remediate the access-control flaw or exposure
- [ ] Rebuild systems if integrity cannot be assured ([malware.md](malware.md) if applicable)
- [ ] Restore from known-good backups if data/config integrity is in doubt — `[TO BE CONFIRMED]`
- [ ] Validate access controls with targeted testing before full restore of trust — `[TODO]`
- [ ] Re-enable services gradually with monitoring

---

## Evidence to Collect

| Evidence | Location / ID | Notes |
| -------- | ------------- | ----- |
| Access / auth / app logs | `[TODO]` | |
| Session termination / account disable records | `[TODO]` | |
| Configuration diffs / unauthorized changes | `[TODO]` | |
| Network / VPN / WAF logs | `[TODO]` | `[TO BE CONFIRMED]` sources |
| Physical access logs / CCTV refs (if any) | `[TODO]` | |
| Incident report and timeline | Templates below | |

---

## Escalation

Follow [../incident-management/incident-escalation.md](../incident-management/incident-escalation.md). Escalate for production compromise, privileged access, data involvement, or inability to terminate access quickly.

---

## Communications

Use [../incident-management/incident-communications.md](../incident-management/incident-communications.md) and [../templates/incident-communication.md](../templates/incident-communication.md). Coordinate any customer or regulator notices with authorized approvers only.

---

## Related Templates

- [../templates/incident-report.md](../templates/incident-report.md)
- [../templates/incident-timeline.md](../templates/incident-timeline.md)
- [../templates/incident-postmortem.md](../templates/incident-postmortem.md)
- [../templates/incident-communication.md](../templates/incident-communication.md)
- [../templates/risk-acceptance.md](../templates/risk-acceptance.md) — for temporary access-control exceptions during recovery

---

## Gap / To Be Confirmed

- [ ] Playbook owner
- [ ] Session termination and access-log tooling
- [ ] Facilities / physical security contacts (if in scope)
- [ ] Vulnerability vs. incident handoff criteria
- [ ] Integrity validation checklist before returning systems to service
