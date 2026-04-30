# OnyxLegal Design System

**Product:** Legixy — AI-Powered Legal & Compliance OS for Indian startups and SMEs  
**Stack:** Next.js 16 App Router · Tailwind CSS v4 · shadcn/ui · Instrument Serif + Instrument Sans  
**Last updated:** 2026-04-30

---

## 1. Product Context

| | |
|---|---|
| **What it is** | AI-powered Legal & Compliance Operating System — contracts, risk detection, clause analysis |
| **Who it's for** | Founders, business owners, non-technical SME users dealing with legal risk |
| **Space** | LegalTech / ComplianceTech / India SME |
| **Emotional target** | *"I trust this product with my business and legal data"* |

**Memorable thing:** "The legal dashboard that takes your contracts as seriously as a law firm does."

---

## 2. Aesthetic Direction

| | |
|---|---|
| **Direction** | Industrial Precision × Restrained Luxury |
| **Decoration level** | Minimal — typography and whitespace do the work |
| **Mood** | Authoritative, calm, precise. Like a well-designed legal document: clear hierarchy, zero clutter, every element intentional |
| **Inspiration** | Stripe (clean + trust) · Linear (modern + smooth) · A well-set legal brief |

**The deliberate risk:** Instrument Serif for display headings. Every other SaaS dashboard uses grotesque-only. Serifs communicate tradition, authority, and seriousness — exactly what legal software needs. Law firms use serifs on their letterheads for the same reason.

**Anti-patterns avoided:**
- No purple gradient heroes
- No gradient CTA buttons
- No bubbly uniform border-radius on everything
- No centered-everything layout
- No Inter (overused to meaninglessness)

---

## 3. Typography System

### Font Stack

| Role | Font | Weight | Why |
|------|------|--------|-----|
| **Display headings** | Instrument Serif | 400 (regular + italic) | Authority, tradition, legal gravitas. The one choice no competitor makes. |
| **Body, UI, labels** | Instrument Sans | 400 · 500 · 600 | Perfect companion (same family). Clean, humanist, readable. Not Inter. |
| **Data, numbers, code** | Geist Mono | 400 | Tabular-nums prevents column-width jitter in risk scores. Techy, precise. |

**Loading:** Google Fonts CDN via Next.js `next/font/google`

### Type Scale

```
display-2xl   48px  Instrument Serif  weight 400  tracking -0.03em  line-height 1.15
display-xl    36px  Instrument Serif  weight 400  tracking -0.02em  line-height 1.2
display-lg    28px  Instrument Serif  weight 400  tracking -0.02em  line-height 1.25

heading-xl    24px  Instrument Sans   weight 600  tracking -0.01em  line-height 1.3
heading-lg    20px  Instrument Sans   weight 600  tracking -0.01em  line-height 1.35
heading-md    16px  Instrument Sans   weight 600  tracking  0       line-height 1.4

body-lg       16px  Instrument Sans   weight 400  line-height 1.65
body-md       15px  Instrument Sans   weight 400  line-height 1.65   ← BASE
body-sm       13px  Instrument Sans   weight 400  line-height 1.6

label         13px  Instrument Sans   weight 500  tracking  0.01em
caption       12px  Instrument Sans   weight 400  color: muted-foreground
mono          14px  Geist Mono        tabular-nums
```

**Weight discipline:** 400 · 500 · 600 only. No 700–900 weights. Legal users process information calmly — the type system should match that mode.

---

## 4. Color System

### Primary Palette

| Token | Light | Dark | Rationale |
|-------|-------|------|-----------|
| `--primary` | `#3D35D3` | `#818CF8` | **Trust Indigo** — deeper than #4F46E5, more authoritative, reads as institutional rather than startup-y |
| `--secondary` | `#F1F5F9` | `#1E293B` | Soft slate for secondary surfaces |
| `--accent` | `#EEF2FF` | `#1E1B4B` | Light indigo wash for selected/highlighted states |
| `--background` | `#F8F9FC` | `#0A0E1B` | Slightly blue-tinted off-white — clinical/professional, not warm/casual. Dark = rich navy-black |
| `--card` | `#FFFFFF` | `#111827` | True white cards stand clearly against background |
| `--foreground` | `#0F172A` | `#F1F5F9` | Near-black with blue undertone — matches the indigo system |
| `--muted-foreground` | `#64748B` | `#94A3B8` | Secondary text, captions, placeholder |
| `--border` | `#E2E8F0` | `rgba(255,255,255,0.08)` | Subtle, cool-tinted, never harsh |
| `--ring` | `#6366F1` | `#6366F1` | Focus ring — indigo |

### AI Violet (secondary brand)

`#6D28D9` — Reserved ONLY for AI-specific features: AI analysis badges, AI loading states, AI-powered action buttons. Never decorative. Purple = intelligence, innovation.

### Precision Teal (accent)

`#0D9488` — Deliberate departure from the typical amber/orange accent. Teal = precise, measured, trustworthy. Used for safe contract states, positive metrics, low-risk badges.

### Semantic Colors — Legal Risk System

These are not decoration. They are the language of risk communication.

| State | Foreground | Background | Border | Text | Usage |
|-------|-----------|-----------|--------|------|-------|
| **Safe / Low Risk** | `#059669` | `#ECFDF5` | `#6EE7B7` | `#065F46` | Low-risk contracts, safe clauses, positive metrics |
| **Warning / Medium** | `#D97706` | `#FFFBEB` | `#FCD34D` | `#78350F` | Medium-risk clauses, items needing review |
| **Danger / High Risk** | `#DC2626` | `#FEF2F2` | `#FCA5A5` | `#7F1D1D` | High-risk clauses, legal danger alerts. NEVER decorative. |
| **AI Processing** | `#2563EB` | `#EFF6FF` | `#BFDBFE` | `#1E40AF` | AI analysis in progress, AI-generated content |

**Color restraint rule:** Maximum 2 accent colors visible on any screen at once. Red is reserved strictly for legal danger. Purple for AI states only. Teal for success/safe states only. The restraint is the trust signal.

---

## 5. Surface & Depth System

### Shadow Scale

```css
--shadow-xs:   0 1px 2px rgba(0,0,0,0.04);
--shadow-sm:   0 1px 3px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02);
--shadow-md:   0 4px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03);
--shadow-lg:   0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
--shadow-xl:   0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05);
--shadow-2xl:  0 24px 64px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06);

/* Semantic glows — for risk badges and primary CTAs only */
--shadow-glow-indigo: 0 0 20px rgba(61,53,211,0.18), 0 0 40px rgba(61,53,211,0.06);
--shadow-glow-teal:   0 0 20px rgba(13,148,136,0.18), 0 0 40px rgba(13,148,136,0.06);
--shadow-glow-red:    0 0 20px rgba(220,38,38,0.15), 0 0 40px rgba(220,38,38,0.05);
```

**Elevation rules:**
- At rest: `shadow-sm`
- On hover: `shadow-lg`
- Modals/drawers: `shadow-xl`
- Floating command palette: `shadow-2xl`

### Glassmorphism

**Use for:** sidebar, command palette, floating panels, overlay modals  
**Never use for:** regular content cards, data tables, form inputs

```css
background: rgba(255,255,255,0.80);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255,255,255,0.25);
```

---

## 6. Spacing System

**Base unit: 8px.** All spacing values are multiples of 8 (or 4 for micro-gaps).

| Token | Value | Use |
|-------|-------|-----|
| `2xs` | 4px | Icon-to-label gaps, inline tight spacing |
| `xs` | 8px | Between related elements |
| `sm` | 12px | Inner component padding (badges, chips) |
| `md` | 16px | Standard inner padding |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 32px | Between sections |
| `2xl` | 48px | Page section padding |
| `3xl` | 64px | Hero sections |
| `4xl` | 96px | Full-page section breaks |

**Density rules:**
- Data tables: compact (8px row padding, 12px cell padding)
- Cards: comfortable (24px padding)
- Hero sections: spacious (64px+ vertical padding)
- Risk analysis danger items: extra 8px vertical spacing above/below — space signals "read this carefully"

---

## 7. Border Radius System

Hierarchical — small radius for precise UI, larger for containers. The contrast signals "precise where it counts."

| Size | Value | Use |
|------|-------|-----|
| `none` | 2px | Data table rows, inline code, tiny chips |
| `xs` | 4px | Badges, tags, tooltips |
| `sm` | 6px | Inputs, small buttons |
| `md` | 8px | Buttons (default), dropdowns, selects |
| `lg` | 12px | Cards (default) |
| `xl` | 16px | Large cards, panels |
| `2xl` | 24px | Modals, drawers |
| `full` | 9999px | Pill buttons, avatar chips |

---

## 8. Interaction Design

### Easing

```css
--ease-out:      cubic-bezier(0.23, 1, 0.32, 1);      /* elements entering — smooth deceleration */
--ease-in:       cubic-bezier(0.4, 0, 1, 1);           /* elements leaving */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);   /* micro-interactions — subtle overshoot */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);        /* general state changes */
```

### Durations

| Name | Value | Use |
|------|-------|-----|
| `micro` | 80ms | Button press, hover color change |
| `fast` | 150ms | Tooltip show/hide, badge state |
| `normal` | 250ms | Card hover, input focus ring |
| `slow` | 400ms | Modal open, page section reveal |

### Hover States

| Element | Transform | Shadow |
|---------|-----------|--------|
| Primary button | `translateY(-1px)` | sm → md |
| Secondary button | `translateY(-1px)` | — |
| Interactive card | `translateY(-2px)` | sm → lg |
| Nav item | none | bg fill `rgba(61,53,211,0.06)` |
| Table row | none | bg fill `rgba(0,0,0,0.02)` |

### Focus States

- **Ring:** `2px solid #3D35D3`, `ring-offset: 2px`
- **Input focus:** border → `#3D35D3` + `box-shadow: 0 0 0 3px rgba(61,53,211,0.10)`
- **Never** use the browser default outline

### Button Press

- `scale(0.97)` + shadow decrease
- Duration: 80ms (`ease-spring`)

---

## 9. Component Style Guide

### Buttons

#### Primary
```
Background:  #3D35D3
Text:        #FFFFFF
Border:      none
Radius:      8px
Padding:     10px 20px
Font:        Instrument Sans, 14px, weight 500
Hover:       bg → #3529BF + translateY(-1px) + shadow-md
Active:      scale(0.97) + shadow-xs
Disabled:    opacity 0.5, cursor not-allowed, no transform
RULE:        NEVER gradient background on primary CTA
```

#### Secondary
```
Background:  transparent
Text:        #3D35D3
Border:      1.5px solid #3D35D3
Hover:       bg → #EEF2FF + translateY(-1px)
Active:      scale(0.97)
```

#### Ghost
```
Background:  transparent
Text:        #64748B
Border:      none
Hover:       bg → #F1F5F9
```

#### Danger
```
Background:  #DC2626
Text:        #FFFFFF
Hover:       bg → #B91C1C
```

---

### Inputs

| State | Border | Shadow |
|-------|--------|--------|
| Rest | `1.5px solid #E2E8F0` | none |
| Focus | `1.5px solid #3D35D3` | `0 0 0 3px rgba(61,53,211,0.10)` |
| Error | `1.5px solid #DC2626` | `0 0 0 3px rgba(220,38,38,0.08)` |
| Disabled | `1.5px solid #E2E8F0` | none |

```
Background:   #FFFFFF
Radius:       6px
Padding:      10px 14px
Font:         Instrument Sans, 15px, weight 400
Placeholder:  #94A3B8
Transition:   150ms ease
```

Error messages: 12px Instrument Sans, color `#DC2626`, appears below input with 4px margin-top.

---

### Cards

#### Default
```
Background:  #FFFFFF
Border:      1px solid #E2E8F0
Radius:      12px
Shadow:      var(--shadow-sm)
Padding:     24px
```

#### Interactive (hover)
```
Shadow:      var(--shadow-lg)
Transform:   translateY(-2px)
Transition:  300ms var(--ease-out)
```

#### Risk Card Variants
```
Safe:    border-left: 3px solid #059669
Warning: border-left: 3px solid #D97706
Danger:  border-left: 3px solid #DC2626 + background: rgba(220,38,38,0.015)
```

Danger cards get extra vertical padding (8px more) around their content — space signals importance.

---

### Risk Badges

```
High Risk:    bg #FEF2F2  · text #991B1B  · border #FCA5A5
Medium Risk:  bg #FFFBEB  · text #92400E  · border #FCD34D
Low Risk:     bg #ECFDF5  · text #065F46  · border #6EE7B7
AI Analysis:  bg #EFF6FF  · text #1E40AF  · border #BFDBFE
AI Powered:   bg #F5F3FF  · text #4C1D95  · border #DDD6FE

Font:    Instrument Sans, 12px, weight 500
Radius:  4px
Padding: 3px 8px
Border:  1px solid
```

---

### Alerts (Inline)

Left border only — not full border. The left border is the risk signal; the background is the context.

```
Success: bg #F0FDF4  · border-left: 4px solid #059669  · text #065F46
Warning: bg #FFFBEB  · border-left: 4px solid #D97706  · text #78350F
Danger:  bg #FEF2F2  · border-left: 4px solid #DC2626  · text #7F1D1D
Info:    bg #EFF6FF  · border-left: 4px solid #2563EB  · text #1E40AF

Padding: 14px 16px
Radius:  0 8px 8px 0
```

---

## 10. Trust Signal Design — The Psychology Layer

These are not aesthetic preferences. They are psychological signals that build user trust.

### 1. Spacing Discipline = Control
Consistent 8px grid. Users unconsciously perceive random spacing as carelessness. Intentional spacing signals that the product is in control of its environment — the same reason legal documents use consistent margins and paragraph spacing.

### 2. Color Restraint = Seriousness
Maximum 2 accent colors on any screen. Red is reserved strictly for legal danger — seeing it anywhere else would erode its meaning. Purple for AI only. Teal for success only. The restraint IS the signal.

### 3. Typography Hierarchy = Clarity
Limited weight range (400/500/600). No 900-weight headlines screaming urgency. Legal work requires calm, methodical reading — the typography matches that mode.

### 4. Serif for Authority
Instrument Serif on page titles and key findings. Law firms use serifs on letterheads for the same reason: subconscious signal of tradition, precision, seriousness. Every other SaaS dashboard uses grotesque-only. This is the deliberate departure.

### 5. Border Radius Hierarchy = Precision
Small radius (6px) on inputs/buttons, larger (12px) on cards. The contrast tells users: "we're precise where it counts, approachable where it helps." Uniform bubbly radius everywhere = toy software.

### 6. Extra Space Around Danger
Risk analysis danger items receive extra vertical padding. Space signals "read this carefully" — the same technique pull quotes and warning callouts use in print design.

### 7. Left Alignment = Document Literacy
Everything left-aligned except isolated CTAs. Legal documents are left-aligned. Users reading contracts have a left-aligned mental model — the UI should match it.

### 8. Flat Primary CTAs
No gradient backgrounds on primary buttons. Flat indigo says "serious action." Gradients say "consumer app." Legal software users are making consequential decisions — the UI should treat those decisions with weight.

---

## 11. CSS Variable Reference

### Light Mode

```css
--background:         #F8F9FC
--foreground:         #0F172A
--card:               #FFFFFF
--card-foreground:    #0F172A
--primary:            #3D35D3
--primary-foreground: #FFFFFF
--secondary:          #F1F5F9
--secondary-foreground: #1E293B
--muted:              #F1F5F9
--muted-foreground:   #64748B
--accent:             #EEF2FF
--accent-foreground:  #3730A3
--destructive:        #DC2626
--border:             #E2E8F0
--input:              #E2E8F0
--ring:               #6366F1

/* Semantic */
--color-success:      #059669
--color-warning:      #D97706
--color-danger:       #DC2626
--color-ai:           #2563EB
--color-violet:       #6D28D9
--color-teal:         #0D9488

/* Shadows */
--shadow-xs:          0 1px 2px rgba(0,0,0,0.04)
--shadow-sm:          0 1px 3px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)
--shadow-md:          0 4px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)
--shadow-lg:          0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)
--shadow-xl:          0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05)
--shadow-glow-indigo: 0 0 20px rgba(61,53,211,0.18), 0 0 40px rgba(61,53,211,0.06)
--shadow-glow-teal:   0 0 20px rgba(13,148,136,0.18), 0 0 40px rgba(13,148,136,0.06)
--shadow-glow-red:    0 0 20px rgba(220,38,38,0.15), 0 0 40px rgba(220,38,38,0.05)

/* Easing */
--ease-out:           cubic-bezier(0.23, 1, 0.32, 1)
--ease-in:            cubic-bezier(0.4, 0, 1, 1)
--ease-spring:        cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-standard:      cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 12. Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-30 | Instrument Serif for display headings | Deliberate serif choice for legal authority — differentiates from every grotesque-only SaaS competitor |
| 2026-04-30 | Instrument Sans for body (replaces Inter) | Same family as Serif, cleaner and more distinctive than Inter |
| 2026-04-30 | Primary deepened to #3D35D3 (from #4F46E5) | More authoritative, institutional read — less "startup blue" |
| 2026-04-30 | Precision Teal (#0D9488) as success accent | Breaks from amber/orange norm — teal = precise, measured, trustworthy |
| 2026-04-30 | AI Violet (#6D28D9) reserved for AI states only | Purple = intelligence; overuse would dilute the signal |
| 2026-04-30 | Background cooled to #F8F9FC | Blue-tinted off-white keeps the clinical/professional mood |
| 2026-04-30 | No gradient on primary CTAs | Flat indigo communicates serious action; gradients = consumer app |
| 2026-04-30 | Border radius hierarchy (6px inputs, 12px cards) | Precision hierarchy — small = careful, large = approachable |
