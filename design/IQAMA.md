# Design note — employee iqama and visa

**Nothing is built. This is a recommendation and a set of decisions to make
before anything is.**

Written against the code, not against an idea of it. Where the brief that
prompted this note and the repository disagree, the repository wins and the
disagreement is stated.

---

## 1. Why it is worth considering

For a manufacturer with expat labour, **a lapsed iqama stops the factory
faster than a lapsed municipal licence.** A Balady licence that expires is a
problem for the branch; an iqama that expires is a person who cannot legally
work, and in the worst case cannot legally remain.

It is also the **one area of this product where legitimate automation exists.**
Everywhere else the honest answer is prepare-and-hand-off: Balady, Civil
Defence, Ejar and Chamber have no partner route, and GOSI's runs through Masdr
with no agreement in place. Muqeem is different — it operates an official
partner API through Elm covering iqama issuance and renewal, exit re-entry
visas and extensions.

That matters for a reason beyond features. The product currently tells the
client, correctly and repeatedly, that it files nothing. Iqama is the first
place where "we could actually submit this" might one day be true — and the
first place where saying so prematurely would be a lie with a long tail.

---

## 2. Why it is not a licence with a different name

The brief listed six objections. Five hold. One is weaker than stated, and one
the brief did not raise is the strongest of all.

### 2.1 Scope — holds

`LicenseScope` is `ENTITY | SITE`. There is no member for a person, and adding
one is not a small change: `assertScopeMatchesSite` treats the enum as a
two-valued invariant (`ENTITY` forbids a site, `SITE` requires one), and a
third member would make that function's contract three-way with no natural
rule for the third. The coverage-gap query, the requirements screen's two
groupings and the import resolver all branch on the same two values.

### 2.2 Coverage gaps — holds, and the difference is sharper than stated

A gap today means *"a licence type you declared you must hold, with no record
at all."* The declaration is what makes the page honest — Slice 12 established
that, and the empty state still says so.

For employees the equivalent proposition is inverted. You do not declare "we
should hold three iqamas"; you employ fifty people and each must have one. The
gap is not *a type with no record*, it is *a person with no valid credential* —
which is a join against a roster the product does not have and should not
invent.

### 2.3 Ownership concentration — holds, and it is the load-bearing one

The dashboard's concentration figure is the product's sharpest insight:
**Faisal holds 75% of assigned licences.** Fifty iqamas assigned to an HR
manager would compute to something like 92%, and it would be *true and
useless* — it would no longer be telling you about a licence dependency, it
would be telling you that HR does HR.

Mixing two populations into one denominator destroys the signal the feature
exists to give. Whatever shape this takes, **iqamas must not enter the licence
ownership rollup.**

### 2.4 Volume — holds

Seventeen licences, eighty reminders. Fifty employees at 5 offsets is 250
reminders before any document. The reminder table is indexed for this
(`@@unique([licenseId, offsetDays, dueOn])`, `@@index([licenseId, status])`),
so it is not a performance problem — it is a *proportion* problem. Every
screen that currently mixes populations would be dominated by the larger one.

### 2.5 Reminder cadence — weaker than the brief states

The brief says 90/60/30/14/7 "was chosen for licences" and iqama windows
differ. Half right. The offsets are a single shared constant —
`REMINDER_OFFSET_DAYS` in `compliance.constants.ts` — used by every licence
type regardless of authority or cycle. They were never tuned per type, so
there is no per-type mechanism to extend and no precedent being broken.

The real point is different and stronger: **the offsets are global, so adding a
population with different windows requires making them configurable for the
first time.** That is a change to the engine, not a parameter passed to it.

### 2.6 Data protection — holds, and it is the reason to be slow

Licence data is corporate: numbers on certificates issued to a company.
Employee data is *personal data about identified individuals at scale* —
names, iqama numbers, nationalities, passport data, and scans of all of it.

Under PDPL that is a materially different obligation, and it would land in the
same document store that currently holds commercial registrations. Slice 15
declared a `DATA_REGION` and made offshore hosting refuse to start without an
explicit override; that control was designed for certificates. It is adequate
for those and I would not call it adequate for fifty employees' passports
without someone who knows PDPL saying so.

### 2.7 The objection the brief did not raise

**The renewal workflow does not fit.**

`LicenseRenewal` models a specific story: gather documents → ready to file →
*a person on your team filed it at the portal* → record the new expiry. Its
entire vocabulary — `AWAITING_AUTHORITY`, "I filed this at the portal", the
Slice 11 honesty rules about who did what — exists to make clear that **the
system does not submit.**

Muqeem is the one place that might eventually be false. If iqama renewal ever
runs through the partner API, this workflow's central claim inverts for that
one credential type, and the copy that makes the product honest everywhere
else becomes wrong there. That is not a reason to avoid it. It is a reason not
to bolt it onto the same entity.

---

## 3. Hijri — the decision, sixth time of asking

`hijriExpiry` exists on `License` as a nullable string, documented as display
only: *"Nothing schedules from this field, and no conversion logic exists."*
That was correct while nothing depended on it. Iqama makes it load-bearing,
because the iqama card prints Hijri and the holder reads Hijri.

**Decision, in four parts.**

### 3.1 Gregorian remains the single scheduling source of truth

`expiryDate` stays `@db.Date`, stays the only field any reminder is computed
from, and stays the only date `assessExpiry` sees. Nothing schedules from a
Hijri value, ever.

This is not conservatism. The entire date architecture — `PlainDate`,
`todayIn(tenant.timeZone)`, `fromPrismaDate`/`toPrismaDate`, the
`SerialisedDates<T>` type that makes a raw `Date` unrepresentable at the
boundary — assumes one calendar. Four date bugs have shipped in this project
and every one was a calendar date briefly becoming something else. Introducing
a second scheduling calendar would reopen that class across every surface at
once.

### 3.2 Hijri is stored as entered, and derived for display

Two fields, both optional:

- `expiryDate` — Gregorian, authoritative, schedules everything
- `expiryHijri` — as printed on the document, stored verbatim

**Both are entered by a person.** The system does not convert one into the
other and present the result as fact.

### 3.3 Conversion, and why not

Umm al-Qura is the Saudi civil calendar. It is **tabular but not arithmetic** —
it is published by KACST and its month lengths are not derivable from a
formula. Every arithmetic approximation disagrees with it by a day in places.

A day is not a rounding error here. A reminder ladder built one day off is a
renewal window missed by one day, and the product's entire promise is that
this does not happen.

So: **no conversion in the product.** Not `Intl.DateTimeFormat` with
`islamic-umalqura` (correct for *display* of a Gregorian date, and available
in Node without a dependency — but display is not the risky direction), and
certainly not an arithmetic library.

**What is offered instead:** when a person enters a Gregorian expiry, show the
Umm al-Qura rendering of that date via `Intl` as a *check*, worded as one:
"That is 12 Rabi' al-Awwal 1449 — does that match the card?" Derived one way
only, from the authoritative field, and presented as something to verify
rather than something asserted.

If the two disagree, the person is asked which is right. The system does not
adjudicate between calendars.

### 3.4 Multi-timezone with two calendars

Unchanged, because only one calendar is ever computed from. `todayIn(timeZone)`
still produces the tenant's Gregorian today; every offset is still whole days
of Gregorian arithmetic. The Hijri string is inert — it is never compared,
sorted or subtracted.

**The rule to write down:** *a Hijri value may be displayed and may be stored.
It may never be an operand.* Any test that sorts, diffs or schedules from
`expiryHijri` is testing something that should not exist.

---

## 4. Recommended shape

**A sibling domain, not an extension.** `Credential` alongside `License`,
sharing infrastructure and sharing no rollups.

### 4.1 The entity

```
Employee    id, tenantId, name, employeeNumber, nationality,
            responsibleUserId    ← who chases this person's paperwork
            (no salary, no passport number, no national ID)

Credential  id, tenantId, employeeId, type, number,
            issueDate, expiryDate (@db.Date, authoritative),
            expiryHijri (String?, inert),
            lifecycle, notes
```

**One entity with a `type`, not several.** Iqama, exit re-entry visa and work
permit differ in cadence and issuer, not in shape — the same argument that
made `LicenseType` a catalogue row rather than five models.

### 4.2 What reuses the engine unchanged

- **Document storage.** `LicenseDocument` keys on `licenseId`; the encryption,
  magic-byte sniffing, retention sweep and audit are credential-agnostic. This
  needs a nullable `credentialId` beside `licenseId`, not a second store.
- **The scheduler.** `ReminderDispatchService.sweep()` iterates tenants and
  claims rows with a database compare-and-swap. It is not licence-shaped —
  the send window, batching, retry and `UNDELIVERABLE` handling all apply.
- **Delivery.** One message per recipient per sweep, and the Slice 16 copy
  address applies unchanged.
- **The audit log.** `ComplianceEntityType` is a union; adding `'credential'`
  is the same one-line change `'tenant'` was in Slice 16.

### 4.3 What does not

- **Reminder generation.** `reconcile(licenseId)` loads a licence and computes
  from `REMINDER_OFFSET_DAYS`. Needs the offsets to become per-type, which is
  the first genuine engine change.
- **Coverage gaps.** No equivalent, and inventing one would require a roster.
  **Recommendation: ship without it.** The honest analogue is far narrower —
  *"employees on record with no valid credential"* — and even that asserts the
  roster is complete, which the product cannot know. It should say what it
  counts and nothing more.
- **Ownership concentration.** Separate rollup, separate denominator. Never
  merged. See 2.3.
- **The renewal workflow.** See 2.7. Credentials get their own, and the
  vocabulary should be decided *after* the Muqeem question is answered, not
  before.

### 4.4 Responsibility

`Employee.responsibleUserId` — the PRO or HR manager who chases that person's
paperwork. Deliberately parallel to `License.ownerUserId` and deliberately
**not** the same rollup. A person can hold both kinds of responsibility; the
figures stay separate because they answer different questions.

### 4.5 The submission route

`Authority.submissionRoute` already models exactly this distinction, with
`PREPARE_ONLY` and `API_ELIGIBLE`, and Slice 6 established what
`API_ELIGIBLE` means: **a route exists to pursue — never that we submit
through it.** GOSI already carries that value with a note saying no agreement
or credentials exist.

Muqeem gets `API_ELIGIBLE` with the same discipline. No client code, no
credential field, no interface implying submission, until a subscription
exists and someone has read the terms.

---

## 5. Cost and sequencing

Roughly **four slices**, assuming the shape above:

1. Schema and the domain — `Employee`, `Credential`, per-type reminder
   offsets, the `credentialId` on documents. The offsets change is the risky
   part; it touches the engine every licence depends on.
2. Screens — roster, credential detail, the year-ahead equivalent, and the
   separate ownership rollup.
3. Documents, retention and the PDPL position.
4. The renewal workflow, whose vocabulary depends on the Muqeem answer.

### Blocked on things that do not exist

- **A Muqeem subscription.** Without it, slice 4's copy cannot be written
  honestly — the product would either promise submission it cannot do or
  describe a workflow it may replace within a quarter.
- **A PDPL position** on fifty employees' personal data in this document
  store. Not a technical question and not mine to answer.
- **Nothing else.** No Hijri dependency is needed, because §3.3 declines to
  take one.

### Before or after the client sees what exists

**After. Clearly after, and it is not close.**

Three reasons, in order of weight:

1. **The most valuable thing in the next conversation is not a feature.** He
   asked for portal automation in writing and has never been told the product
   went another way. That conversation has to happen, and it goes far better
   before a demo than during one.
2. **The best argument for building this is his reaction to what exists.** If
   the ownership-concentration screen lands — if he looks at 75% on one person
   and recognises his own company — then the same argument applies to fifty
   iqamas and he will say so himself. If it does not land, iqama would have
   been built on a guess.
3. **Muqeem is the one place a real submission route exists**, which makes it
   the one place worth asking him about directly. That answer should shape the
   design; the design should not pre-empt it.

Building this first would trade a product that is ready to show for one that is
larger and still unshown.
