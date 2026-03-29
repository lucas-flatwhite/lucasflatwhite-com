# Homepage Hero Refresh Design

## Summary

Replace the current warm `terminal cafe` first screen with a more modern `CLI minimal` hero. The landing impression should be quieter, sharper, and more contemporary: a large monospace `'/lucas-flatwhite'`, a small `thinking spinner` to its left, one short supporting sentence, and a small set of low-contrast command-like actions.

## Why This Change

The current palette and hero mood lean too heavily into warm coffee branding. That makes the page feel less current than intended and weakens the desired first impression. The refreshed hero should feel more like a precise tool surface than a themed cafe interface while still keeping a recognizable terminal lineage.

## Goals

- Make the first screen feel modern, restrained, and typographically strong.
- Keep terminal identity through rhythm and motion rather than overt terminal gimmicks.
- Establish `'/lucas-flatwhite'` as the clear visual anchor of the page.
- Preserve immediate navigation with visible actions instead of hiding interaction behind novelty UI.

## Non-Goals

- No return to a full terminal emulator or typed-command interaction.
- No colorful neon hacker aesthetic.
- No dense hero copy or marketing-style CTA stack.

## Agreed Direction

### Overall Tone

The hero follows a `CLI minimal` direction:

- near-monochrome dark presentation
- strong monospace headline
- minimal supporting copy
- restrained animation
- visible but low-emphasis actions

The screen should read as `poster first, interface second`.

### Hero Composition

The first viewport uses a simple composition:

- a small spinner positioned to the left of the main title block
- a large monospace `'/lucas-flatwhite'` headline as the dominant element
- one supporting line directly beneath the headline
- three visible actions such as `Projects`, `GitHub`, and `Contact`

The layout should stay close to the previously explored `Quiet Monument` direction: mostly open space, minimal chrome, and strong focus on the headline. The action row remains present, but its visual weight stays secondary.

### Typography

- The primary headline uses a monospace family rather than a serif display face.
- The monospace choice should feel clean and contemporary, not retro or novelty-coded.
- The large title should carry the identity of the hero almost by itself.
- Supporting copy and utility text can remain in a secondary type treatment if needed, but the hero should feel visually governed by the monospace title.

### Supporting Copy

- Exactly one supporting line appears beneath the title.
- The line should be short and quiet, not explanatory.
- The hero must not accumulate multiple paragraphs or stacked descriptive blocks.

## Color System

The selected palette is `Graphite + Cold White`.

### Core Tokens

- background foundation around `#0b0d10`
- primary text around `#f5f7fa`
- muted copy and status text around `#8e99a8`
- border and pill edges around `#1d232c` to `#26303c`

### Color Principles

- Avoid pure black and pure white in favor of slightly cooled neutrals.
- Keep the hero almost monochrome.
- Do not reintroduce the old warm coffee family for the first screen.
- Use accent energy sparingly and only where interaction or motion benefits from it.

This palette is intended to feel current and precise without drifting into an aggressive cyberpunk or gamer visual language.

## Motion

### Spinner

- The spinner should feel like a `thinking spinner`, not a status alarm.
- Motion is slow, calm, and continuous.
- Target timing is roughly one full rotation every `2.4s` to `2.8s`.
- The spinner should remain small relative to the headline.

### Page Entrance

- The hero content may use a brief fade-up or similar restrained entrance.
- The motion should suggest presence, not spectacle.
- Avoid large slide-ins, flashy reveals, or multiple competing animation layers.

## Interaction Model

### Command Pills

- The hero keeps at least three visible actions.
- Actions should resemble command pills rather than bright marketing buttons.
- Default state should be low contrast.
- Hover and focus states may increase brightness or border clarity slightly.
- Actions must stay obviously clickable, but they should not compete with the title for attention.

### Visual Priority

The visual hierarchy should remain:

1. `'/lucas-flatwhite'`
2. supporting line
3. action row

The spinner supports the identity of the hero but should not become the dominant focal point.

## Responsive Behavior

- On mobile, keep the spinner associated with the title instead of isolating it elsewhere.
- Allow the large title to wrap naturally across lines if needed.
- Preserve the quiet composition even when the action pills wrap to multiple rows.
- Maintain generous negative space where possible instead of compressing the hero into a dense card.

## Implementation Notes

- Update the current hero component rather than building a separate hero system.
- Replace the existing warm palette tokens in the global styling with the new neutral system.
- Preserve accessibility through sufficient contrast and visible focus treatment.
- Ensure motion respects reduced-motion preferences.

## Risks and Guardrails

### Risk: Too Sterile

If everything becomes too flat or anonymous, the hero may lose personality. Guardrail: keep the spinner and monospace title emotionally present even while reducing color and ornament.

### Risk: Too Interface-Like

If the action row or panel chrome becomes too prominent, the hero will feel like an app shell rather than a landing page. Guardrail: treat actions as secondary and keep the overall composition poster-like.

### Risk: Too Terminal-Coded

If green accents or overt prompt metaphors return, the design may slip into genre costume. Guardrail: rely on pacing, typography, and restraint instead of obvious terminal references.

## Success Criteria

The refresh is successful if:

- the first screen is immediately recognizable through the large `'/lucas-flatwhite'` title
- the new hero feels more modern than the previous warm coffee direction
- the spinner adds life without reading as decorative clutter
- actions remain usable without weakening the hero's quiet visual authority
- desktop and mobile both preserve the same restrained mood
