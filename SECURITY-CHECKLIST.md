# Pre-Go-Live Checklist

This code implements the SOAR's functional workflow and a reasonable set
of application-layer security controls. It has **not** been independently
security-tested. Before any live tender is run through it:

## Must do before go-live
- [ ] Independent penetration test and remediation of findings (SOAR 8.4)
- [ ] Replace the application-layer opening quorum with an HSM or
      cryptographic threshold-secret-sharing scheme for real multi-person
      key control (SOAR 8.2)
- [ ] Rotate and vault `JWT_SECRET` / `SUBMISSION_ENCRYPTION_KEY` through a
      proper secrets manager — never commit real values to source control
- [ ] Put uploaded/encrypted files in object storage with server-side
      encryption and versioning (not local disk, as this scaffold does)
- [ ] Enforce MFA for all internal roles (SEC-001) — the schema has a
      `mfaEnabled` flag but no MFA flow is implemented yet
- [ ] Add rate limiting / WAF / DDoS protection at the network edge
      (SOAR 8.4) — only basic login rate limiting exists today
- [ ] WCAG 2.1 AA accessibility audit (NFR-006)
- [ ] Load/performance testing against NFR-001–003 targets
- [ ] Legal review of retention periods, disposal workflow, and cooling-off
      timing against the current Regulations and any PPRA circulars
- [ ] Replace the demo seed accounts and disable open self-registration
      of internal (non-bidder) users in production

## Integration work required (contracts/credentials from third parties)
- [ ] National eProcurement System interoperability
- [ ] PPRA Contractor Register verification
- [ ] CIPA beneficial ownership lookup
- [ ] BURS tax clearance verification
- [ ] SMS gateway for high-priority notifications
- [ ] SIEM/SOC log forwarding

## Recommended before pilot (not blocking, but should not be skipped long)
- [ ] Digital signature / PKI integration for opening panel and
      evaluation-report sign-off (currently these are simple DB records,
      not cryptographically signed)
- [ ] File-download route for evaluators to retrieve opened bid content
      under access control (the current opening endpoint verifies
      integrity and produces the opening record, but a dedicated,
      logged download route is needed for the evaluation stage)
- [ ] Business continuity / disaster recovery plan and its first test
      (SOAR 13)
- [ ] Records Management System handoff for archived procurements
