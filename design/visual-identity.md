# Visual identity exploration

This document records the Phase 3 directions and the recommendation. The permanent component, token, responsive, accessibility, and content rules live in the project-root [`DESIGN.md`](../DESIGN.md).

## Direction comparison

| | Measured editorial | Instrument panel | Night observatory |
|---|---|---|---|
| Palette | `#F4F3EF` background, `#17232D` text, `#315CCB` blue, `#B86136` amber | `#E9EFED` background, `#163A36` text, `#D66B42` orange, `#FAFBF9` surface | `#111820` background, `#F0EEE7` text, `#202B35` surface, `#D18458` copper |
| Type | Newsreader display + IBM Plex Sans; IBM Plex Mono labels | IBM Plex Sans + IBM Plex Mono | Newsreader display + IBM Plex Sans/Mono |
| Layout | Airy 12-column editorial grid, asymmetric hero and evidence rail | Tighter 10-column evidence grid | Open dark canvas, thin rules, focused case-study column |
| Cards / borders | White surface, 6px radius, quiet 1px rules | Mineral surface, 4px radius, denser labels | Slate cards, low-radius edges, subdued rules |
| Controls / nav | Ink primary button, outlined secondary; light sticky header | Spruce action, orange secondary; compact nav | Parchment action, copper focus accent; dark header |
| Hero / project treatment | Strong editorial thesis with named Systems Atlas; case studies as readable essays | Capability/evidence index up front; projects resemble an engineering catalog | Atlas becomes a high-contrast map; projects read as technical dossiers |
| Signature | Selectable project-to-concept map with evidence-aware detail | Filter projects by engineering concern | Trace one project path through its system map |
| Risk | Serif can feel too literary if overused | Can look like a dashboard rather than a personal portfolio | Harder long-form reading and resembles a common dark developer theme |

## Recommendation

Choose **Measured editorial**. Its light-first palette and restrained serif display create a premium identity, while Plex Sans/Mono keep technical reading practical. The design risk is the Systems Atlas: a real navigation map connecting four project pages to concepts, not arbitrary animated nodes. Use the warm accent sparingly for evidence status, and never rely on its color alone.

## Homepage composition

Desktop: max 1200px; hero split 7/5 with the positioning statement and profile context on the left, Systems Atlas on the right. Place featured work below in a two-column grid, then linked capability groups, competitive programming, confirmed achievements, and contact. Mobile: stack the hero and convert the Atlas to a vertical, keyboard-accessible list before the project cards.

## Interaction and accessibility

Atlas selection highlights a connected path and updates an adjacent text panel; links open case studies. Use native links/buttons, visible focus, 44px touch targets, reduced-motion behavior, and a static diagram/text equivalent. On narrow layouts, reflow diagrams rather than requiring sideways page scrolling. The precise color combinations must be checked after rendering; token intent alone does not guarantee contrast compliance.
