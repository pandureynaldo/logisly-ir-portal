# Security Incident Runbooks

**During an incident, start at [START HERE](../START-HERE.md) (step 2: Handle)** to pick the matching runbook.

Document Owner: <!-- var:DOCUMENT_OWNER -->pandu.reynaldo@logisly.com<!-- /var:DOCUMENT_OWNER -->  
Version: 1.0  
Status: Draft  
Classification: Internal  

---

## Purpose

Index of Logisly security incident response runbooks. Use these playbooks with the incident management process, escalation paths, and communications guidance. Named tools, vendors, SLAs, and owners remain placeholders until confirmed.

---

## Runbooks

| Runbook | When to use |
| ------- | ----------- |
| [Phishing](phishing.md) | Suspected or confirmed phishing emails, links, or credential-harvesting lures |
| [Compromised Account](compromised-account.md) | Account takeover, credential abuse, or unauthorized use of an identity |
| [Malware](malware.md) | Suspected or confirmed malware on endpoints or servers |
| [Ransomware](ransomware.md) | Ransomware encryption, ransom demands, or related destructive malware |
| [Data Leak](data-leak.md) | Suspected or confirmed unauthorized disclosure or exfiltration of data |
| [Unauthorized Access](unauthorized-access.md) | Access without authorization to systems, data, or facilities (logical or physical indicators) |
| [Cloud Security Incident](cloud-security-incident.md) | Security incidents in <!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER --> / cloud-hosted environments |
| [Data Recovery](data-recovery.md) | RDS/S3 deletion or corruption, AWS Availability Zone or Region disruption, and production AWS account loss |

---

## Related Documents

| Document | Location |
| -------- | -------- |
| Incident escalation | [../incident-management/incident-escalation.md](../incident-management/incident-escalation.md) |
| Incident communications | [../incident-management/incident-communications.md](../incident-management/incident-communications.md) |
| Incident report template | [../templates/incident-report.md](../templates/incident-report.md) |
| Incident timeline template | [../templates/incident-timeline.md](../templates/incident-timeline.md) |
| Incident postmortem template | [../templates/incident-postmortem.md](../templates/incident-postmortem.md) |
| Incident communication template | [../templates/incident-communication.md](../templates/incident-communication.md) |
| Risk acceptance template | [../templates/risk-acceptance.md](../templates/risk-acceptance.md) |

---

## Gap / To Be Confirmed

- [ ] Document Owner and playbook owners for each runbook
- [ ] Detection, EDR, email security, IAM, SIEM, backup, and cloud admin tooling names
- [ ] Confirmed reporting channels: <!-- var:REPORTING_CHANNEL_PRIMARY -->Email devops@logisly.com<!-- /var:REPORTING_CHANNEL_PRIMARY -->, <!-- var:REPORTING_CHANNEL_EMERGENCY -->Telepon/WhatsApp call Lesmana Nugroho; jika tidak terjangkau, telepon Niyoko Yuliawan. Email devops@logisly.com untuk jejak.<!-- /var:REPORTING_CHANNEL_EMERGENCY -->
- [ ] Named <!-- var:IR_PRIMARY_OWNER -->lesmana.nugroho@logisly.com<!-- /var:IR_PRIMARY_OWNER --> and <!-- var:IT_SECURITY_TEAM -->lesmana.nugroho@logisly.com<!-- /var:IT_SECURITY_TEAM --> contacts
- [ ] Cloud provider identity (<!-- var:CLOUD_PROVIDER -->niyoko.yuliawan@logisly.com<!-- /var:CLOUD_PROVIDER -->) and shared-responsibility contacts
