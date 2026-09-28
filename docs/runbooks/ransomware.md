# Ransomware Runbook

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose / When to Use

Use this runbook when ransomware is suspected or confirmed: mass file encryption, ransom notes, extortion contacts, wipe/encrypt behaviors, or related destructive malware impacting Logisly systems or backups.

**Critical principles**

1. **Isolate first** — stop spread before cleanup or negotiation discussions.
2. **Do not pay ransom** unless Management and Legal explicitly decide otherwise — decision authority and process are `[TO BE CONFIRMED]`.
3. **Protect and validate backups** — assume attackers may target backup infrastructure.

Use <!-- var:REPORTING_CHANNEL_EMERGENCY -->Telepon/WhatsApp call Lesmana Nugroho; jika tidak terjangkau, telepon Niyoko Yuliawan. Email devops@logisly.com untuk jejak.<!-- /var:REPORTING_CHANNEL_EMERGENCY --> for active encryption or critical-system impact.

---

## Immediate Actions (First ~15 Minutes)

- [ ] Open [incident report](../templates/incident-report.md) and [timeline](../templates/incident-timeline.md) immediately
- [ ] **Isolate** affected hosts from the network (EDR isolate / disconnect) — `[TO BE CONFIRMED]` method
- [ ] Identify and isolate adjacent systems showing encryption/ransom indicators
- [ ] **Do not** power off unless needed for safety or approved evidence process — prefer network isolation
- [ ] **Do not pay**, negotiate, or communicate with threat actors unless Management/Legal authorize — `[TO BE CONFIRMED]`
- [ ] Protect backup systems: restrict access, pause risky replication from infected segments if advised — `[TO BE CONFIRMED]`
- [ ] Notify <!-- var:IR_PRIMARY_OWNER -->lesmana.nugroho@logisly.com<!-- /var:IR_PRIMARY_OWNER -->, <!-- var:IT_SECURITY_TEAM -->lesmana.nugroho@logisly.com<!-- /var:IT_SECURITY_TEAM -->, and escalate per severity
- [ ] Preserve ransom note samples and contact method details as evidence (do not execute attached payloads)

---

## Containment

- [ ] Confirm isolation of all known impacted systems and file shares
- [ ] Disable compromised accounts and revoke sessions ([compromised-account.md](compromised-account.md))
- [ ] Block C2 / payment / dropper IOCs on approved controls — `[TO BE CONFIRMED]`
- [ ] Halt nonessential privileged remote access during active response — `[TODO]`
- [ ] Assess whether cloud / identity / backup consoles show unauthorized access ([cloud-security-incident.md](cloud-security-incident.md) if applicable)
- [ ] Snapshot/preserve forensic state of critical systems before rebuild if process allows — `[TO BE CONFIRMED]`

---

## Investigation Pointers

- Initial access vector (phishing, RDP/VPN, vulnerability, compromised account)
- Encryption scope: hosts, shares, SaaS, backups
- Presence of data theft / double-extortion indicators ([data-leak.md](data-leak.md))
- Persistence and lateral movement artifacts
- Backup integrity and last known-good restore points — `[TO BE CONFIRMED]`
- Whether Management/Legal, cyber insurance, or external IR retainers should be engaged — `[TO BE CONFIRMED]`

---

## Eradication / Recovery

- [ ] Rebuild impacted systems from known-good images; avoid trusting in-place “decrypt and continue” without approval — `[TO BE CONFIRMED]`
- [ ] Restore data from **verified clean** backups; test restore before broad cutover — `[TO BE CONFIRMED]`
- [ ] Rotate credentials, keys, and secrets across the blast radius
- [ ] Patch/close initial access path before reconnecting systems
- [ ] Reintroduce systems in stages with heightened monitoring — `[TODO]`
- [ ] Ransom payment: **default is do not pay**; any exception requires Management and Legal decision — `[TO BE CONFIRMED]`
- [ ] Document recovery validation criteria before declaring service restored — `[TODO]`

---

## Evidence to Collect

| Evidence | Location / ID | Notes |
| -------- | ------------- | ----- |
| Ransom note(s) and extortion communications | `[TODO]` | Do not pay/engage without authorization |
| Impacted host/share inventory | `[TODO]` | |
| Encryption timeline / sample encrypted files | `[TODO]` | |
| Backup status and restore-point inventory | `[TODO]` | |
| Identity / remote access logs for initial access | `[TODO]` | |
| Decision log (isolation, restore, payment stance) | `[TODO]` | Management/Legal decisions |
| Incident report and timeline | Templates below | |

---

## Escalation

Follow [../incident-management/incident-escalation.md](../incident-management/incident-escalation.md). Treat active ransomware as high/critical. Engage Management, Legal, and any approved external IR support per contacts directory — `[TO BE CONFIRMED]`.

---

## Communications

Use [../incident-management/incident-communications.md](../incident-management/incident-communications.md) and [../templates/incident-communication.md](../templates/incident-communication.md). External and customer/regulator notices require authorized approval. Do not discuss ransom payment intentions outside authorized decision-makers.

---

## Related Templates

- [../templates/incident-report.md](../templates/incident-report.md)
- [../templates/incident-timeline.md](../templates/incident-timeline.md)
- [../templates/incident-postmortem.md](../templates/incident-postmortem.md)
- [../templates/incident-communication.md](../templates/incident-communication.md)
- [../templates/risk-acceptance.md](../templates/risk-acceptance.md) — if temporary exceptions remain during recovery

---

## Gap / To Be Confirmed

- [ ] Playbook owner
- [ ] Isolation tooling and authority
- [ ] Backup ownership, immutability posture, and restore runbooks
- [ ] Management/Legal decision process for ransom / extortion
- [ ] Cyber insurance / external IR engagement path
- [ ] Outage and customer communication approvers
