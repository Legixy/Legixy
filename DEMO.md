# Legixy — the walkthrough

Eight steps, in the order the client's own problem unfolds. Each says what to
open, what to point at, and what it proves.

**Twelve to fifteen minutes** at a natural pace, plus questions. Steps 3, 4 and
6 are the ones to slow down on; step 7 can be cut if you are short.

The demo tenant is **Masar Al-Khaleej Trading Co.** — a synthetic Saudi
trading and manufacturing company, four sites, seventeen licences. Nothing in
it is real, and it is deliberately *not* modelled on the prospect: inventing a
client's compliance position and showing it back to them is a bad way to be
wrong in a meeting.

---

## Before you start

```bash
cd onyxlegal-core
npm run demo:reset      # rebuilds the tenant exactly, from any state
npm run demo:check      # GO / GO WITH CAVEATS / NO-GO
```

`demo:check` asks the app for every page on this path and reads what comes
back. It exists because a broken stylesheet once returned 500 on every route
while the entire test suite stayed green.

| | |
|---|---|
| **URL** | http://localhost:3000 |
| **Email** | `nadia@masaralkhaleej.example` |
| **Password** | `Demo2026!legixy` |

**Read the verdict before you begin.** If it says `NO DELIVERY CHANNEL`, step
6's email cannot be shown — see the note there.

---

## 1. Everything in one place · ~1 min

**Open:** Dashboard.

**Point at:** the four figures — Tracked 17, Expired 1, Action needed 2,
Coming up 3 — then the line reconciling licences held at sites against those
held company-wide.

**Say:** "Seventeen licences across four locations. One register, one screen."

**It proves** what the spreadsheet cannot: a number correct right now, in
Riyadh time, that nobody maintains.

**Then click "Expired 1."** It opens the licences list filtered to that one
licence. Every figure here is a link, and every link filters.

---

## 2. What needs attention · ~2 min

**Open:** Licences → **Needs attention**.

**Point at:** the Signage Permit for the Exit 9 showroom, expired 23 days ago,
and the Balady licence for the same showroom, 12 days out.

**Say:** "Not *what do we hold*. *What needs me this month.*"

**It proves** status is derived, not typed. Nobody set a flag.

Note the sort and the **Expiry ↑** marker: whatever is closest to lapsing is
already at the top.

**Then open The year ahead.** The bar for **April 2027** is roughly three
times any other, and the line above says so.

**Say:** "Those five are the commercial registration, chamber membership,
GOSI, Qiwa and the head-office municipal licence. They renew together because
they were obtained together at formation. That is normal — and invisible in a
spreadsheet sorted by date."

The ramp reads amber → yellow → green with no legend. Note also *"1 licence
has no expiry date recorded, so it cannot appear here"* — a licence with no
date is invisible to every forward view, and the screen says so rather than
letting a calm year hide it.

---

## 3. What is not being tracked at all · ~2 min

**The differentiator. Do not rush it.**

**Open:** **Not on record**.

**Point at:** *Muqeem Establishment Registration* — declared as required, with
no record at all.

**Say:** "Every other system tracks what you gave it. This is the only screen
that tells you about something you never entered."

**Then open** *What to expect*, and show the list came from a person ticking
boxes, not an algorithm guessing.

**It proves** the honest boundary. Say it out loud:

> "It cannot tell you what you're missing until you tell it what you're
> supposed to hold. Before you do that, this screen says so rather than
> claiming you're covered."

That sentence is on the screen for a brand-new account.

---

## 4. Who holds it · ~2 min

**The moment. Also the thing he has never said out loud.**

**Open:** Dashboard → **Who holds the licences**.

**Point at:** **Faisal Al-Harbi holds 75% of assigned licences** — twelve of
sixteen. Nadia two, Huda two, one with nobody at all.

**Say:** "Normal for a company this size — the PRO holds nearly everything. It
is also a single point of failure. If Faisal leaves, or is on leave in April
when five renewals land, nobody else knows what is due."

Let that sit.

**Then open** the Civil Defence certificate for Al-Khumrah Warehouse. Point at
the banner: *nobody is assigned to this licence, so these reminders cannot be
delivered.*

**Say:** "It will not pretend to remind someone who does not exist."

---

## 5. A licence in detail · ~2 min

**Open:** Balady Municipal Licence, Exit 9 Showroom.

**Point at, in order:**

1. The expiry and days remaining.
2. **Reminder schedule** — 90, 60, 30, 14, 7 days before. One already **Sent**.
3. **Documents** — the checklist comes from the licence *type*, so it knows
   what Balady asks for without anyone configuring it.
4. **Renewal preparation** — what to gather, from the same checklist.

**Say:** "You did not set this schedule up. It exists because the licence has
a date."

---

## 6. A renewal, and the register updating itself · ~3 min

**The best moment in the product. Give it room.**

**Open:** the same licence → **Renew this licence**.

**Walk it:** Start → *Everything is gathered* → **I filed this at the portal**
→ record the new expiry (`2027-09-16`).

**Point at the button wording.** It says *I filed this at the portal*, not
*Submit*.

**Say:** "It never files anything. Your team goes to Balady's own portal. This
records that you did, so the register does not drift out of step with
reality."

**Then point at the reminder schedule.** Verified end to end on this data:

- Every date has moved to 2027 — 18 Jun, 18 Jul, 17 Aug, 2 Sep, 9 Sep
- The four reminders from the old period collapsed into *"4 reminders from
  before this licence was renewed"*, kept as a record of what was sent
- The expiry is now 2027-09-16 and the status is back to **Current**

**It proves** the loop closes without anyone re-entering anything.

**If a delivery channel is configured**, run `npm run smtp:test -- you@example.com`
and open the mail. Point at what is *not* in it — no licence number, no
document. The message says so itself.

**If `demo:check` said NO DELIVERY CHANNEL**, do not improvise:

> "Email credentials are the one thing still outstanding. The schedule is
> built, the reminders are queued, and the moment we have an SMTP account they
> go out — nothing is lost in the meantime."

Then show the **Sent** entry on the timeline. That is honest and still
convincing. Do not claim a message was sent.

**Afterwards:** `npm run demo:reset` puts the licence back.

---

## 7. How forty-seven licences get in · ~2 min

**Open:** Licences → **Import from a spreadsheet**. The date rule is on this
first screen — no need to upload anything.

**Point at it:**

> `01/02/2026` is refused, because it can be read as either 1 February or
> 2 January.

**Say:** "It refuses to guess. A guessed date builds the whole reminder
schedule on the wrong day, and you would not find out until something lapsed."

**Also show** Licences → **Add one licence**, for the single-licence case.

---

## 8. People, and where reminders go · ~2 min

**Open:** **People and reminders**.

**Point at:** the channel state, each person and the address their reminders
reach, then **Licences with nobody responsible**.

**Then point at "Add someone to this workspace."** This is where a second
person is put in the register — the answer to "how do I get Faisal in here",
which is the question step 4 raises and nothing answered until now. With no
email channel configured it says so and hands you the link to pass on
yourself; it does not claim an invitation was sent.

**Set the copy address** to your own email and save. Point at the line beneath:

> *This does not make anyone responsible for a licence. A licence with nobody
> assigned still shows as unassigned.*

**Say:** "One address that sees everything — yours, or your accountant's.
Copied on every reminder, and it catches the ones nobody is assigned to. It
does not pretend that solves the ownership gap; the count above it does not
move."

**On WhatsApp**, which the screen answers before anyone asks:

> *Not available. Reminders are sent by email only.*

Do not soften it. Do not say it is coming.

---

## When they ask what it does not do

The product's own words, already on its screens.

**"Does it submit renewals for me?"**
> No. Nothing here files anything with any authority. Your team files on the
> authority's own portal and records that they did. Every stage is worded that
> way — the button reads *I filed this at the portal*.

**"Does it connect to Balady / Qiwa / GOSI?"**
> No. No government API is connected, no credentials are stored, no portal
> automation exists. Where a route exists in principle — GOSI has one through
> Masdr — the system says a route exists, never that it uses it.

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
> Not today, and the product says so on screen rather than leaving you to find
> out. Email is the channel that exists.

**"What about our employees' iqamas?"**
> Not built. It is the closest adjacent thing to this, and the one area where
> a real submission route exists — Muqeem runs an official partner API through
> Elm. Worth a conversation; not worth a promise today.

---

## If something fails mid-demo

| Symptom | Do this |
|---|---|
| Data looks wrong or half-edited | `npm run demo:reset`, refresh |
| "Cannot reach the server" | Core is down. Restart it, then `npm run demo:check` |
| A page is blank or unstyled | `npm run demo:check` — it names the route |
| Login fails | Check `demo:check`'s Database line |
| A reminder did not arrive | Check the Delivery line. No channel? Say so — see step 6 |
| Everything is expired | The demo drifted past its dates. `npm run demo:reset` |
| The year ahead looks flat | The April cluster is missing. `npm run demo:reset` |
| A copy address you set has gone | `demo:reset` rebuilds the tenant. Set it after resetting, not before |

**The recovery is almost always `npm run demo:reset`** — seconds, exact, and
tested to restore identical state from any state.
