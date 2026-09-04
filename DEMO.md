# Legixy — the walkthrough

Ten steps, in the order the client's own problem unfolds. Each says what to
open, what to point at, and what it proves.

The demo tenant is **Masar Al-Khaleej Trading Co.** — a synthetic Saudi
trading and manufacturing company with four sites and seventeen licences.
Nothing in it is real. It is deliberately *not* modelled on the prospect:
inventing a client's compliance position and showing it back to them is a bad
way to be wrong in a meeting.

---

## Before you start

```bash
cd onyxlegal-core
npm run demo:reset      # rebuilds the tenant exactly, from any state
npm run preflight       # GO / GO WITH CAVEATS / NO-GO
```

Then start Core and Web, and sign in:

| | |
|---|---|
| **URL** | http://localhost:3000 |
| **Email** | `nadia@masaralkhaleej.example` |
| **Password** | `Demo2026!legixy` |

**Read the preflight verdict before you begin.** If it says
`NO DELIVERY CHANNEL`, step 7 changes — see the note there.

---

## 1. Everything in one place

**Open:** Dashboard.

**Point at:** the four figures across the top — Tracked, Expired, Action
needed, Coming up — then the line beneath them reconciling licences held at
sites against those held company-wide.

**Say:** "Seventeen licences across four locations. One register, one screen."

**It proves** the thing the spreadsheet cannot do: a single number that is
correct right now, in Riyadh time, without anyone maintaining it.

---

## 2. The shape of the year

**Open:** **The year ahead**.

**Point at:** the bar for **April 2027**, which is roughly three times any
other, and the line above it: *"April 2027 is the heaviest month, with 5
expiring."*

**Say:** "Those five are the commercial registration, chamber membership,
GOSI, Qiwa and the head-office municipal licence. They renew together because
they were obtained together when the company was formed. That is normal — and
it is invisible in a spreadsheet sorted by date."

**It proves** the thing a list cannot do. The licences page shows those same
five scattered through seventeen rows with nothing to notice; here the shape
tells you before you read a word.

**Also point at:** *"1 licence has no expiry date recorded, so it cannot
appear here."* A licence with no date is invisible to every forward view in
the product, and the view says so rather than letting a calm year hide it.

---

## 3. What needs attention

**Open:** Licences, then click **Needs attention**.

**Point at:** the Signage Permit for Exit 9 — expired 23 days ago — and the
Balady Municipal Licence for the same showroom, expiring in 12 days.

**Say:** "This is the question the spreadsheet is bad at. Not *what do we
hold*, but *what needs me this month*."

**It proves** that expiry status is derived, not typed. Nobody set a flag.

Point out the sort: soonest first, and the **Expiry ↑** marker on the column.
Whatever is closest to lapsing is already at the top.

---

## 4. What is not being tracked at all

This is the differentiator. Do not rush it.

**Open:** **Not on record**.

**Point at:** *Muqeem Establishment Registration* — declared as required,
with no record at all.

**Say:** "Every other system on this list tracks what you gave it. This is the
only screen that tells you about something you never entered."

**Then open** *What to expect* and show that the list came from a person
ticking boxes, not from an algorithm guessing.

**It proves** the honest boundary. Say it out loud:

> "It cannot tell you what you're missing until you tell it what you're
> supposed to hold. Before you do that, this screen says so rather than
> claiming you're covered."

That sentence is on the screen for a brand-new account. It is worth showing.

---

## 5. Who holds it

**Open:** Dashboard, scroll to **Who holds the licences**.

**Point at:** the concentration — most licences sit with one person — and the
**Unassigned** count.

**Open:** the Civil Defence Certificate for Al-Khumrah Warehouse.

**Point at:** the banner: *nobody is assigned to this licence, so these
reminders cannot be delivered.*

**Say:** "It will not pretend to remind someone who does not exist."

**It proves** the product refuses to look healthier than it is — the failure
that matters most is stated on the record it affects.

---

## 6. A licence in detail

**Open:** Balady Municipal Licence — Exit 9 Showroom.

**Point at, in order:**

1. The expiry and the days remaining.
2. **Reminder schedule** — 90, 60, 30, 14 and 7 days before. One is already
   marked **Sent**.
3. **Documents** — the checklist comes from the licence *type*, so it knows
   what Balady asks for without anyone configuring it.
4. **Renewal preparation** — what to gather, drawn from the same checklist.

**Say:** "The schedule is not something you set up. It exists because the
licence has a date."

---

## 7. A reminder that actually arrives

**If preflight said a delivery channel is configured:**

```bash
npm run smtp:test -- your.email@example.com
```

Open the mail in front of them. Point at what is *not* in it: no licence
number, no document, no attachment. The message says so itself —
*"Licence numbers and documents are not included in this email. Sign in to see
them."*

**Say:** "Email is not a safe place for a commercial registration number.
The reminder tells you what needs attention and where to look."

**If preflight said NO DELIVERY CHANNEL:** do not improvise. Say plainly:

> "Email credentials are the one thing still outstanding. The schedule is
> built, the reminders are queued, and the moment we have an SMTP account
> they go out — nothing is lost in the meantime."

Then show step 6's timeline with the **Sent** entry, and the **Reminders**
panel in the header. That is honest and it is still convincing. Do not claim a
message was sent.

---

## 8. A renewal, closing the loop

**Open:** the Balady licence → **Renew this licence**.

**Walk it:** Start → *Everything is gathered* → **I filed this at the portal**
→ record the new expiry.

**Point at:** the button wording. It says *I filed this at the portal*, not
*Submit*.

**Say:** "It never files anything. Your team goes to Balady's own portal. This
records that you did, so the register does not drift out of step with
reality."

**Then point at** the reminder timeline: it has rebuilt itself from the new
date, and the old reminders have moved into *"reminders from before this
licence was renewed"* — kept as a record of what was sent.

**It proves** the loop closes without anyone re-entering anything.

---

## 9. How forty-seven licences get in

**Open:** Licences → **Import from a spreadsheet**.

**Walk to the preview step** without committing. Point at the date rule:

> `01/02/2027` is refused, because it can be read as either 1 February or
> 2 January.

**Say:** "It refuses to guess. A guessed date builds the whole reminder
schedule on the wrong day, and you would not find out until something
lapsed."

**Also show:** Licences → **Add one licence**, for the single-licence case —
one new branch, one new permit.

---

## 10. Where reminders actually go

**Open:** **Where reminders go**.

**Point at:** the channel state, then the list of people and the address each
one's reminders reach, then **Licences with nobody responsible**.

**Say:** "This is the answer to 'how do I know it reached me'. Every person,
and the address it goes to."

**Then set the copy address** to your own email and save it. Point at what it
says underneath:

> *This does not make anyone responsible for a licence. A licence with nobody
> assigned still shows as unassigned.*

**Say:** "You can have one address that sees everything — yours, or your
accountant's. It is copied on every reminder, and it catches the ones nobody
is assigned to. It does not pretend that solves the ownership gap; the count
above it does not move."

**On WhatsApp**, if asked — and the screen answers it before they ask:

> *Not available. Reminders are sent by email only.*

Do not soften it. Do not say it is coming.

---

## When they ask what it does not do

Answer plainly. These are the product's own words, already on its screens.

**"Does it submit renewals for me?"**
> No. Nothing here files anything with any authority. Your team files on the
> authority's own portal and records that they did. Every stage is worded that
> way — the button reads *I filed this at the portal*.

**"Does it connect to Balady / Qiwa / GOSI?"**
> No. No government API is connected, no credentials are stored, and there is
> no portal automation. Where a route exists in principle — GOSI has one
> through Masdr — the system says that a route exists, never that it uses it.

**"Does it log in with Nafath?"**
> No. No Nafath, no OTP, no stored government credentials.

**"Does the AI read my certificates?"**
> No. Nothing is extracted automatically. Everything on the record was entered
> by a person or imported from your own spreadsheet.

**"Will it tell me if I'm compliant?"**
> No, and it deliberately never says so. It tells you what is on record and
> what you told it to expect. Whether the business is compliant is a judgment
> about the business, not about the register.

**"Can it remind us on WhatsApp?"**
> Not today, and the product says so on the "Where reminders go" screen rather
> than leaving you to find out. Email is the channel that exists. If WhatsApp
> matters, that is worth telling us — it is not built.

---

## If something fails mid-demo

| Symptom | Do this |
|---|---|
| Data looks wrong or half-edited | `npm run demo:reset` — seconds, and exact. Refresh. |
| A screen says "Cannot reach the server" | Core is down. Restart it, then `npm run preflight`. |
| Login fails | Check preflight's Database line. |
| "Continue with Google" is missing | Correct. It is hidden because no credentials are configured. Do not mention it. |
| A reminder did not arrive | Check preflight's Delivery line. If there is no channel, say so — see step 6. |
| Everything is expired | The demo drifted past its dates. `npm run demo:reset` recomputes them relative to today. |
| The year ahead looks flat | The cluster is in April. If it is not there, the data drifted — `npm run demo:reset`. |
| A copy address you set has gone | `demo:reset` rebuilds the tenant, which clears it. Set it again after resetting, not before. |

**The recovery is always the same:** `npm run demo:reset`, then refresh. It
restores identical state from any state, and it is tested to do so.
