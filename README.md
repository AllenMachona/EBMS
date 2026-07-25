# EBMS — Electronic Bid Management System

A working full-stack implementation of the core Electronic Bid Management
System workflow, built against the attached Statement of Operational and
Architectural Requirements (SOAR) for the Botswana public procurement
environment.

Stack: **Node.js / Express / PostgreSQL (Prisma ORM)** backend,
**React / Vite / Tailwind** frontend.

---

## What this delivers

A complete, runnable procurement lifecycle:

1. **Initiation** — Procurement Unit / User Department creates a tender
   with a generated tender number (FR-INIT-001).
2. **Bidding package** — documents uploaded with SHA-256 integrity hashes
   (FR-DOC-007).
3. **Publication & bidder registration** — companies self-register once
   and get an isolated portal workspace (SOAR 7.5).
4. **Communications** — questions/clarifications/addenda through one
   official channel (SOAR 7.6).
5. **Sealed submission** — bid files are **AES-256-GCM encrypted at
   upload**; late submissions are rejected and logged without exposing
   content; withdrawal/replacement supported before closing (SOAR 7.7).
6. **Controlled opening** — decryption is blocked until a **configurable
   quorum of distinct opening-panel members** have each confirmed
   attendance — no single user, including a System Administrator, can
   open a bid alone (FR-OPEN-003/004).
7. **Evaluation** — independent scoring per committee member before a
   consensus view is revealed (FR-EVAL-004); dual-envelope procedures
   keep the financial envelope locked until technical outcome approval
   (FR-EVAL-006).
8. **Award & cooling-off** — publishing an award starts a configurable
   cooling-off timer; **contract conclusion is programmatically blocked**
   until it expires and any complaints are resolved (FR-AWD-005/006).
9. **Complaints** — filing a complaint automatically places the
   procurement on hold.
10. **Audit trail** — every material action writes an **append-only**
    `AuditLog` row (actor, action, before/after values, IP, timestamp).
    There is no update/delete route for this table anywhere in the code.

Role-based access control covers all roles in SOAR Appendix A
(Accounting Officer, Oversight Unit, Procurement Unit, User Department,
Committee Chair/Member/Secretary, Opening Panel, Auditor, System Admin,
Bidder), and bidder-to-bidder isolation is enforced **server-side** on
every submission route — a bidder can never query another bidder's
records, matching acceptance criteria AC-01/AC-02.

---

## What is explicitly NOT included

Being direct about this matters more than pretending otherwise — none of
the following can be honestly delivered as source code alone, and every
real EBMS vendor treats them as separate infrastructure/compliance
workstreams:

- **Hardware-backed key custody / true Shamir secret-sharing** for
  opening — the current quorum control is enforced at the application
  layer (N distinct confirmations required before decryption), which is
  a legitimate and auditable control, but is not equivalent to an HSM or
  cryptographic threshold scheme. Upgrading to one is a scoped follow-on.
- **Live integrations** to the National eProcurement System, PPRA
  Contractor Register, CIPA, BURS, or a government SMS gateway — these
  require credentials/contracts from those bodies. Integration
  *endpoints* and data contracts are stubbed and documented so a real
  integration can be plugged in without redesigning the data model.
- **Penetration testing, WCAG 2.1 AA certification, SIEM wiring,
  disaster-recovery drills** — these are assurance/ops activities that
  happen against a deployed system, not something a codebase can claim
  for itself.
- **PPRA standardised bidding package content** (the actual legal
  templates/forms) — the system has a document library and version
  control mechanism to hold them, but the templates themselves must come
  from PPRA.

Flag these to whoever is reviewing the deliverable — a real procurement
system rollout budgets for exactly this list before go-live.

---

## Running it locally

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or a connection string to a hosted instance)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, and SUBMISSION_ENCRYPTION_KEY
# Generate an encryption key with:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm install
npx prisma migrate dev --name init
npm run seed        # creates one demo user per role + one demo bidder
npm run dev          # starts on http://localhost:4000
```

Seeded demo accounts (password for all: `ChangeMe123!`) are listed in
`backend/src/seed.js` — e.g. `procurement@pe.gov.bw` (Procurement Unit),
`panel1@pe.gov.bw` / `panel2@pe.gov.bw` (Opening Panel, for testing the
quorum control), `chair@pe.gov.bw` / `member1@pe.gov.bw` /
`member2@pe.gov.bw` (Evaluation Committee),
`bidder@kalahariconstruction.co.bw` (demo bidder).

**Change or remove these accounts before any real deployment.**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173, proxies /api to :4000
```

Open `http://localhost:5173`, sign in with any seeded account.

### Suggested demo walkthrough

1. Log in as `procurement@pe.gov.bw`, create a procurement, advance it to
   `SUBMISSION_OPEN`.
2. Log in as `bidder@kalahariconstruction.co.bw` (or register a new
   company at `/register`), submit a sealed bid.
3. Back as Procurement Unit, advance to `CLOSED`.
4. Log in as `panel1@pe.gov.bw` and `panel2@pe.gov.bw` in two browser
   sessions, each confirm presence, then open the envelope once quorum
   is met — note that opening is refused until both have confirmed.
5. As committee members, submit independent scores; view consensus.
6. As `ao@pe.gov.bw` (Accounting Officer), publish the award; try to
   conclude the contract immediately (blocked by cooling-off) — this
   demonstrates FR-AWD-006 working as a hard control, not just a UI hint.

---

## Project structure

```
ebms-project/
  backend/
    prisma/schema.prisma      full data model
    src/
      config/db.js
      middleware/             auth, RBAC, audit logging, opening quorum, bidder isolation
      routes/ + controllers/  one pair per domain area
      utils/                  encryption, status machine, receipts
      seed.js
  frontend/
    src/
      pages/                  Login, Dashboard, Procurement detail, Submission, Opening, Evaluation, Award
      components/             Layout, ProtectedRoute
      context/AuthContext.jsx
      api/client.js
  README.md                   this file
```

## Before this goes anywhere near production

Read `SECURITY-CHECKLIST.md` — it lists, item by item, the gap between
"this repo" and "cleared for a live public tender."
