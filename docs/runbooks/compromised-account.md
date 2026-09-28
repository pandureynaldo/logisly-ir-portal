# Compromised Account Runbook

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose / When to Use

Use this runbook when a Logisly identity (user, service, admin, or application account) is suspected or confirmed compromised — including credential theft, session hijacking, MFA bypass indicators, unauthorized mail/app access, or anomalous authentications.

Report via <!-- var:REPORTING_CHANNEL_PRIMARY -->Email devops@logisly.com<!-- /var:REPORTING_CHANNEL_PRIMARY --> (or <!-- var:REPORTING_CHANNEL_EMERGENCY -->Telepon/WhatsApp call Lesmana Nugroho; jika tidak terjangkau, telepon Niyoko Yuliawan. Email devops@logisly.com untuk jejak.<!-- /var:REPORTING_CHANNEL_EMERGENCY --> for privileged/high-impact accounts).

---

## Immediate Actions (First ~15 Minutes)

- [ ] Open [incident report](../templates/incident-report.md) and [timeline](../templates/incident-timeline.md)
- [ ] Identify account type (standard, privileged, service, external/partner) and systems in scope
- [ ] Disable or suspend the account **or** force credential reset + session revocation per confirmed IAM procedure — `[TO BE CONFIRMED]`
- [ ] Revoke active sessions, refresh tokens, API keys, and app passwords associated with the account — `[TO BE CONFIRMED]`
- [ ] If phishing-led, preserve the lure and follow [phishing.md](phishing.md)
- [ ] Notify <!-- var:IR_PRIMARY_OWNER -->lesmana.nugroho@logisly.com<!-- /var:IR_PRIMARY_OWNER --> / <!-- var:IT_SECURITY_TEAM -->lesmana.nugroho@logisly.com<!-- /var:IT_SECURITY_TEAM -->
- [ ] For privileged or broadly scoped accounts, escalate per severity without delay

---

## Containment

- [ ] Block further authentication from known-bad locations/IPs/devices — `[TO BE CONFIRMED]`
- [ ] Reset credentials; require MFA re-registration if MFA factors may be compromised — `[TO BE CONFIRMED]`
- [ ] Review and remove malicious inbox rules, forwarding, OAuth/consent grants, SSH keys, and access tokens
- [ ] Temporarily restrict access to sensitive apps/data for the identity — `[TODO]`
- [ ] Isolate endpoints used during the compromise window if malware is suspected ([malware.md](malware.md))

---

## Investigation Pointers

- Authentication logs: success/fail, geo/IP, device, MFA claims — `[TO BE CONFIRMED]` log sources
- Privilege use, admin actions, and mailbox/data access during the compromise window
- Changes to identity attributes, groups, MFA methods, API keys, or federation trusts
- Concurrent incidents (phishing, malware, unauthorized access, data leak)
- Service accounts: secret age, rotation history, where the secret is stored/used — `[TODO]`

---

## Eradication / Recovery

- [ ] Confirm attacker persistence mechanisms removed (rules, keys, consents, backdoor accounts)
- [ ] Issue new credentials/secrets via approved secure channel — `[TO BE CONFIRMED]`
- [ ] Re-enable account only after verification checklist complete — `[TODO]`
- [ ] Validate MFA enrollment and conditional access posture — `[TO BE CONFIRMED]`
- [ ] Rotate any secrets the account could have accessed
- [ ] Monitor the account for recurrence for a defined period — `[TO BE CONFIRMED]`

---

## Evidence to Collect

| Evidence | Location / ID | Notes |
| -------- | ------------- | ----- |
| Auth / IAM logs for compromise window | `[TODO]` | |
| Session / token revocation records | `[TODO]` | |
| Mail rules / OAuth grant changes | `[TODO]` | |
| Admin / privileged action audit | `[TODO]` | |
| Related phishing or malware artifacts | Link other incidents | |
| Incident report and timeline | Templates below | |

Do **not** store recovered passwords or raw session tokens in documentation repositories.

---

## Escalation

Follow [../incident-management/incident-escalation.md](../incident-management/incident-escalation.md). Escalate for privileged accounts, production impact, suspected data access/exfiltration, or inability to contain quickly.

---

## Communications

Use [../incident-management/incident-communications.md](../incident-management/incident-communications.md) and [../templates/incident-communication.md](../templates/incident-communication.md). Inform affected user(s) of required actions (reset, MFA) through approved channels only.

---

## Related Templates

- [../templates/incident-report.md](../templates/incident-report.md)
- [../templates/incident-timeline.md](../templates/incident-timeline.md)
- [../templates/incident-postmortem.md](../templates/incident-postmortem.md)
- [../templates/incident-communication.md](../templates/incident-communication.md)
- [../templates/risk-acceptance.md](../templates/risk-acceptance.md) — if residual access exceptions remain

---

## Gap / To Be Confirmed

- [ ] Playbook owner
- [ ] IAM / SSO / MFA admin tooling and disable/revoke run steps
- [ ] Log sources and retention for authentication investigations
- [ ] Privileged account emergency contacts
- [ ] Post-recovery monitoring duration
