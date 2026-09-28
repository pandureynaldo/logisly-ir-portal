# Phishing Runbook

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose / When to Use

Use this runbook when Logisly personnel report or detect suspected phishing (email, messaging, SMS, or similar lures), credential-harvesting pages, malicious attachments/links, or successful interaction with a phishing message (click, open, reply, or credential submission).

Report via <!-- var:REPORTING_CHANNEL_PRIMARY -->Email devops@logisly.com<!-- /var:REPORTING_CHANNEL_PRIMARY --> (or <!-- var:REPORTING_CHANNEL_EMERGENCY -->Telepon/WhatsApp call Lesmana Nugroho; jika tidak terjangkau, telepon Niyoko Yuliawan. Email devops@logisly.com untuk jejak.<!-- /var:REPORTING_CHANNEL_EMERGENCY --> if impact is severe or ongoing).

---

## Immediate Actions (First ~15 Minutes)

- [ ] Acknowledge the report and open an incident record using [../templates/incident-report.md](../templates/incident-report.md)
- [ ] Record reporter, receipt time, and how the message was received
- [ ] Preserve the original message and headers; do **not** forward the live lure broadly — use safe evidence handling per `[TODO]` tooling guidance
- [ ] Instruct the reporter not to click further links, open attachments, or enter credentials
- [ ] If credentials may have been entered, treat as potential [compromised account](compromised-account.md) and begin account containment immediately
- [ ] Notify <!-- var:IT_SECURITY_TEAM -->lesmana.nugroho@logisly.com<!-- /var:IT_SECURITY_TEAM --> / <!-- var:IR_PRIMARY_OWNER -->lesmana.nugroho@logisly.com<!-- /var:IR_PRIMARY_OWNER --> via the appropriate reporting channel
- [ ] Start the [incident timeline](../templates/incident-timeline.md)

---

## Containment

- [ ] Quarantine or block the message / sender / URL / attachment across the email or messaging platform using confirmed tooling — `[TO BE CONFIRMED]`
- [ ] Reset or revoke credentials if submission is suspected or confirmed (see [compromised-account.md](compromised-account.md))
- [ ] Block or sinkhole known-bad indicators on perimeter / DNS / proxy controls — `[TO BE CONFIRMED]`
- [ ] Isolate affected endpoints if malware delivery is suspected (see [malware.md](malware.md))
- [ ] Search for additional deliveries of the same campaign — `[TO BE CONFIRMED]` search method/tooling

---

## Investigation Pointers

- Message headers, authentication results (SPF/DKIM/DMARC if applicable), and source indicators
- URL / attachment analysis results from approved tooling — `[TO BE CONFIRMED]`
- Which users received, opened, clicked, or submitted credentials
- Whether any session tokens, MFA factors, or app passwords were exposed
- Lateral activity after interaction (login anomalies, mail rules, data access)
- Linkage to broader campaigns or prior incidents — `[TODO]`

---

## Eradication / Recovery

- [ ] Remove malicious messages from remaining mailboxes where tooling allows — `[TO BE CONFIRMED]`
- [ ] Confirm credential resets, session revocation, and MFA re-enrollment as needed
- [ ] Remediating any mail forwarding rules, OAuth grants, or inbox rules added by an attacker
- [ ] Restore normal access only after containment verification
- [ ] Update blocks/filters and user guidance as appropriate — `[TODO]`
- [ ] Close or hand off to post-incident review when recovery criteria are met — `[TO BE CONFIRMED]`

---

## Evidence to Collect

| Evidence | Location / ID | Notes |
| -------- | ------------- | ----- |
| Original message (safe copy) + headers | `[TODO]` | No live credential entry into analysis accounts without approval |
| Screenshots of lure / landing page | `[TODO]` | Redact secrets |
| User interaction list (open/click/submit) | `[TODO]` | |
| Account/auth logs for affected users | `[TODO]` | |
| URL/file hashes / analysis reports | `[TODO]` | |
| Timeline and incident report | Link templates below | |

Do **not** store passwords, tokens, or private keys in the evidence folder.

---

## Escalation

Follow [../incident-management/incident-escalation.md](../incident-management/incident-escalation.md). Escalate immediately if credentials were submitted, privileged accounts are involved, malware executed, or data exposure is suspected.

---

## Communications

Coordinate drafts with [../incident-management/incident-communications.md](../incident-management/incident-communications.md) and [../templates/incident-communication.md](../templates/incident-communication.md). Do not send external notices without authorized approval per escalation guidance.

---

## Related Templates

- [../templates/incident-report.md](../templates/incident-report.md)
- [../templates/incident-timeline.md](../templates/incident-timeline.md)
- [../templates/incident-postmortem.md](../templates/incident-postmortem.md)
- [../templates/incident-communication.md](../templates/incident-communication.md)

---

## Gap / To Be Confirmed

- [ ] Playbook owner
- [ ] Email security / phishing reporting tooling and quarantine process
- [ ] URL/file analysis tooling
- [ ] Confirmed reporting channels and on-call contacts
- [ ] User notification templates for phishing campaigns
