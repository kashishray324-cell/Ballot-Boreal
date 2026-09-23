# Ballot Boreal — Design System

## Product

Ballot Boreal is a private community-ballot dApp for municipal associations, cooperatives, and campus bodies. A person proves locally that they are eligible and can vote once, while the election only receives an anonymous nullifier and their encrypted/committed choice. The primary interface is a seven-step voter journey, plus a modest public results view.

## Design direction

Nordic civic minimalism: quiet, readable public-service design with a clear institutional rhythm. It is inspired by durable wayfinding, paper notices, and northern daylight—not crypto dashboards, flags, folklore, or “futuristic” gradients. The tone is calm, literal, and reassuring. The interface uses a pale mineral canvas, evergreen ink, icy blue for focus, and a restrained warm amber for attention. All important voter information remains readable at a glance.

The selected library influence is **Mosaic Grid Architecture Style**, adapted away from developer-tool aesthetics: retain its precise hairlines, flat surfaces, and generous negative space; replace dark/technical density with human, task-led civic guidance.

## Information architecture

- Header: product mark, public results, help, network/wallet status.
- Voter workspace: requirement → local eligibility data → privacy review → disclosure review → wallet → proof → final receipt.
- Privacy boundary: a two-column visual that separates “stays on this device” from “published to Midnight.”
- Results: public turnout, finalized proof count, and choices only after the ballot rules permit them.
- Gemini panel: public-language assistant, visibly stating it sees policy text only.

## Visual foundation

- **Canvas / paper:** #F4F6F2
- **Surface:** #FFFFFF
- **Evergreen ink:** #17382C
- **Deep ink:** #17201C
- **Secondary text:** #52635A
- **Hairline:** #D6DED7
- **Ice focus:** #006F8F
- **Privacy teal:** #126E63
- **Attention amber:** #B46A17
- **Success:** #1E6A42
- **Error:** #A33A33
- **Typography:** `Manrope` for headings and body; `IBM Plex Mono` for provenance, identifiers, and state labels. No decorative display faces.
- **Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- **Layout:** max-width 1200px, 24px desktop gutters, 16px mobile gutters. 12 columns desktop; single column below 760px.
- **Corners:** 4px generally; 999px only for compact status pills.
- **Depth:** no floating-card aesthetic. Use thin borders, subtle #17382C 6% tinted surfaces, and a single restrained shadow only for modal/dialog elevation.
- **Icons:** 1.75px rounded-line icons, universally legible: shield, key, wallet, check, external link, data boundary.

## Components

- A thin running stepper with numbered stages and an explicit current-state label.
- Requirement card with a public-policy tag, deadline, and “what this means” plain-language expander.
- Local-data card identified by a device/lock icon; it never displays sensitive field values in public views.
- Disclosure card with an allow-list of only two deliberate outputs: eligibility = valid; vote nullifier.
- Proof progress panel uses a calm horizontal sequence, never a spinning crypto ornament.
- Receipt panel shows only finalized network ID, timestamp, and public outcome; no optimistic fake receipt.
- Wallet selector shows 1AM preference, network, and session-only disconnect.

## Motion & accessibility

- Framer Motion transitions are 180–240ms, ease-out, and communicate sequence/progress only.
- Use a 2px ice-blue focus ring offset 3px on all interactive elements.
- Minimum contrast is WCAG AA; meaningful state always includes words and iconography, not color alone.
- `prefers-reduced-motion` removes transform motion and animation loops, retaining immediate status changes.
- Keyboard traversal follows the voter journey. Error summaries receive focus and live-region announcements.

## Responsive behavior

- Desktop: left rail holds the seven steps; content and privacy boundary form a 2-column grid.
- Tablet: horizontal compact stepper, content remains full width.
- Mobile: sticky “Step x of 7” bar, one decision per screen, 48px touch targets, wallet/status moved into a bottom sheet.

## Copy principles

- Name what is public and private in every consequential action.
- Prefer “Prove eligibility privately” over protocol terms. Explain zero knowledge only after the core task is clear.
- Never promise anonymity without clarifying the public receipt contains an unlinkable uniqueness nullifier.
