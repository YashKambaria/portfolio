# Design system — Yash Kambaria portfolio

## Product and audience
Personal engineering portfolio for Yash Kambaria, a Nirma University Computer Science undergraduate graduating May 2027. Audience: software engineering recruiters, engineering managers, backend engineers, and interviewers. Primary job: establish backend focus quickly, then make verified project evidence easy to inspect.

## Approved visual direction
Hybrid premium with interactive engineering visualizations. Use a light-first, warm-neutral canvas, crisp ink typography, precise blue signal color, and small amber evidence markers. Do not default to dark mode. Two related signature devices carry the experience: **The Systems Atlas** is a navigable map connecting four project case studies by their engineering concepts, and **Particle Engineering** is a single, semantic particle field that evolves through computing forms as the reader moves through the homepage. Keep all surrounding UI quiet. Avoid purple/blue gradients, neon, glassmorphism, fake terminals, generic bento grids, invented product screenshots, human-like particle sculptures, and generic node clouds.

## Three explored routes
1. **Measured editorial (recommended):** light `#F4F3EF`, ink `#17232D`, blue `#315CCB`, amber `#B86136`; Newsreader display, IBM Plex Sans body, IBM Plex Mono technical labels. Asymmetric 12-column grid, hairline dividers, square-to-soft 6px corners, generous 88px section rhythm. Hero is a thesis and Systems Atlas is the memorable visual risk.
2. **Instrument panel:** pale mineral `#E9EFED`, deep spruce `#163A36`, signal orange `#D66B42`, chalk surface `#FAFBF9`; IBM Plex Sans and Mono. Tighter 10-column grid, evidence-led project cards, 4px corners, denser 64px sections. Strong technical tone, but risks feeling like an admin dashboard.
3. **Night observatory:** midnight `#111820`, slate `#202B35`, parchment text `#F0EEE7`, muted copper `#D18458`; Newsreader and IBM Plex Sans/Mono. Dark-first, open grid, thin rules, low-radius surfaces. Dramatic project maps, but less distinctive and less comfortable for long reading; offer only as an optional theme if later requested.

## Recommended tokens
### Color
- Primary ink `#17232D`; secondary spruce `#31504D`; accent blue `#315CCB`; secondary accent amber `#B86136`.
- Background `#F4F3EF`; surface `#FFFFFF`; raised surface `#ECEAE4`.
- Text primary `#17232D`; secondary `#52616A`; muted `#5E6A72`; border `#D7D9D5`.
- Success `#216747`; warning `#80520B`; error `#A3312D`; information `#244F9B`.
- Use text labels/icons alongside status colors. Verify rendered text and focus combinations against WCAG 2.2 AA; target 4.5:1 normal text and 3:1 large text/UI boundaries. Never use amber for small text on the light background without a contrast check.

### Typography
Two primary families: **Newsreader** for display only; **IBM Plex Sans** for body/UI. **IBM Plex Mono** is a supporting technical face, not a third general-purpose family.
- Display: clamp 44–72px, 1.02 line height, restrained use.
- H2: 32–40px; H3: 22–28px; body 16–18px / 1.55; caption 12–14px; technical labels 12–13px uppercase/mono; buttons 14–16px semibold.
- Use system fallbacks; keep long case-study paragraphs in Plex Sans.

### Layout
- Content max 1200px; 12-column desktop grid, 24px gutters; tablet 8 columns, 20px gutters; mobile 4 columns, 16px gutters.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 88, 112px. Desktop section gaps 88px; tablet 64px; mobile 52px.
- Breakpoints: 640px, 768px, 1024px, 1280px. At narrow widths collapse to one column; no horizontal page overflow.
- Project card target: desktop 2-column cards, 280–360px tall depending on content; mobile full width, content-led height.
- Radius: 6px controls/cards, 10px diagram frame; no pill-shaped everything. Borders 1px solid token border.

## Components
- **Navbar:** wordmark `YK`, links Work/About/Skills/Achievements/Contact, optional verified résumé action. 72px desktop height; mobile menu button with 44px target. Sticky only if it does not obscure focus or anchors.
- **Buttons:** primary ink fill with white text; secondary outlined; text links underlined on hover/focus. 44px minimum height; visible 2px focus ring with offset.
- **Project cards:** title, accurate one-line description, concept label, limited verified stack tags, repository/case-study affordances. Entire card is one semantic link; no false metrics.
- **Tech tags:** neutral surface, subtle border, concise names; never imply proficiency level.
- **Achievement blocks:** event, placement, track/date, evidence link. Hide claims until confirmed.
- **Case-study sections:** Problem, Architecture, Implementation, Decisions & trade-offs, Challenges, Lessons, Evidence. Mark source-verified vs README-described vs planned.
- **Architecture diagrams:** static SVG/canvas-free baseline with text equivalent; keyboard-operable node selection; selected path and explanatory text; evidence provenance visible.
- **Footer:** GitHub, LeetCode, contact, résumé only when verified; compact sitemap and copyright.
- **Links:** recognizable, consistent, underlined in prose; external links identified accessibly.

## Particle Engineering
Particle Engineering makes the scroll journey legible without becoming a second navigation system. It is one persistent, fixed-index WebGL point field positioned in the right visual region; it never introduces unrelated abstract particle scenes or a separate canvas per section.

- Hero → open laptop on the right; Systems Atlas → CPU processor on the left; Featured Projects → cooling fan on the right; Technical Capabilities → `JAVA` on the left; Competitive Programming → `DSA` on the right. At desktop, the associated content occupies the opposite side, creating a protected reading lane. Compact layouts put particles behind content surfaces rather than forcing a side-by-side composition.
- Every formation uses the same particle count and index ordering. The renderer packs the target position buffers in one texture and uses shader interpolation for bidirectional scroll morphs. Formation-specific scale caps keep the hardware entirely within its reserved canvas lane; the CPU is deliberately smaller because its pins extend beyond its package.
- Hardware is generated from original procedural surfaces. Type is sampled from an actual bold text mask. The visible result must read as hardware or lettering before a visitor reads any explanatory caption.
- Light mode uses dark ink with restrained signal-blue variation. The laptop rocks gently, and scrolling through Featured Work turns only the fan blades around the fixed hub. Morphs follow scroll position in both directions through the designated gaps.
- On the light-mode laptop, a quick pointer sweep scatters dots past the frame in the direction of travel. Hovering inside the projected display gathers some screen dots into the dark-blue “Yash - Java Dev” signature.
- The other light-mode formations respond to the same sweep. Hover sends signals across the CPU, spins up the fan blades, and reveals a compiler flow beneath `JAVA` or a search tree and `O(log n)` beneath `DSA`.
- Dark mode uses a near-black forest canvas, green surfaces and silver text. The dark particle field starts as Iron Man, moves to the opposite lane for Systems Atlas, and scatters into standing Doctor Doom before Featured Projects. Standing Doom scatters and reassembles in the seated pose with the throne in the gap before Competitive Programming. All poses share one point mesh and use the supplied references.
- Dark-mode hotspot brackets mark interactive areas visually. Iron Man's reactor and six-stone gauntlet hold their shape during hover, and the rest of the armor responds to swipes. Standing Doom gathers emerald rings around intact hands. Hovering over his visible silhouette lifts green-tinted particle stones from below the viewport on both sides, including behind the temporarily faded work and skills content. The stones hold together longer as they fly toward the viewer. In the seated pose, gentle repulsion accompanies the glow of the throne, belt and eyes.
- Standing Doom's eyes and a ground ring light up with the stone charge. Hover over Iron Man's unprotected armor to open the shoulder panels and launch particle rockets. Each Infinity Stone briefly affects nearby portfolio content. Time wipes it visually, and Mind previews the next existing Atlas project before restoring the selected one.
- In both themes, points drift locally and vary gently in brightness. Dark figures use a slower drift over broad surfaces, with the silhouettes, armor edges and faceplates closely anchored to the reference. Each formation holds its silhouette between scroll transitions.
- Dark pages share a low-contrast forest and bronze backdrop with a faint grid at the edges. The homepage adds copper reactor rings behind Iron Man and raised green arches around Doom’s standing and seated silhouettes. The artwork follows the scroll gaps and responds gently to fine pointers. Reduced motion keeps the framing fixed.
- Reduced motion and WebGL context loss retain a static laptop poster in light mode and the CSS backdrop in dark mode. The initial canvas enters without a placeholder flash.

Runtime ownership remains Model B: [`src/styles/tokens.css`](src/styles/tokens.css) and [`src/styles/themes.css`](src/styles/themes.css) are canonical CSS token sources; `--particle-*` semantic variables supply particle colors, while [`src/components/background/ParticleBackground.module.css`](src/components/background/ParticleBackground.module.css) owns layer geometry. This document records the visual intent and mapping rather than generating CSS.

## Homepage visual specification
### Desktop
Header across the content width. Hero uses 7/5 columns: left has role headline, Nirma/May 2027 line, concise backend-focused statement and Explore Work/GitHub actions; right contains the Systems Atlas overview with four named project destinations. Under it: featured projects in a two-column layout, capability groups linked to evidence, competitive programming, achievements (confirmed only), about/contact. Use editorial whitespace and rules instead of decorative gradients.
### Mobile
Compact header and accessible menu; hero stacks headline, education, actions, then a simplified vertical Atlas. Projects stack as full-width cards. Capability groups become short linked rows. Avoid tiny diagrams; Atlas nodes become a vertical list with a text explanation.

## Case-study visual specification
Use a shared shell with breadcrumb, project title/summary, verified role/scope, repository/demo links, local contents, problem statement, system map, implementation details, engineering decisions/trade-offs, challenges, lessons, and evidence. Distinguish implemented details from README claims and future plans. No invented screenshots or outcome metrics. Smart Splitwise: show equal-split and greedy settlement logic, avoid claiming concurrency guarantees. Event-driven: show verified Feign → persistence → Kafka flow and failure boundary. Parking Guardian: validate implementation before drawing a definitive architecture. Currency Exchange: separate source-level conversion from README-described Kubernetes/ArgoCD deployment; label missing manifests honestly.

## Systems Atlas interaction contract
The Atlas is a navigation index, not a generic node cloud. Four labeled project anchors connect to concept lanes: balances/settlements; service events/async work; authenticated API/integrations/notifications; services/containers/orchestration. Selecting a project highlights its connected concepts and reveals a concise, evidence-qualified description; selecting again follows the case-study link. Keyboard users can move through ordinary links/buttons, with `aria-current`/selected state and visible focus. Include a static overview and adjacent text list. Do not imply every concept is implemented in every project. Reduced-motion mode removes path animation; default state works without motion or scripting.

## Accessibility and responsive contract
Target WCAG 2.2 AA: semantic headings/landmarks, 4.5:1 normal text contrast, 3:1 large text and controls, visible keyboard focus, non-color status cues, 44px touch targets, 200% zoom reflow, reduced-motion support, accessible name/state for Atlas controls, and no focus hidden under sticky navigation. Every diagram has a readable text equivalent. Do not encode meaning only through hover.

## Content integrity
Use only verified project claims and current profile facts. Latest LeetCode figures supplied by Yash take precedence over stale indexed counts, but refresh/date them before publication. Hackathon placements need supporting evidence. Do not publish repository credentials; resolve Smart Splitwise's exposed compose-file secrets before linking prominently. Keep metrics out unless documented and attributable.
