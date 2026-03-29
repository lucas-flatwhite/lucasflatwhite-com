# Astro Portfolio Redesign Design

## Summary

Rebuild `lucasflatwhite-com` as an Astro-based portfolio site that keeps the playful terminal identity of the current single-page site without making visitors work like they are using a real terminal. The result should feel like a `terminal cafe`: expressive, slightly mischievous, but still immediately readable and easy to navigate.

## Goals

- Preserve the recognizable terminal mood of the current site.
- Improve usability so first-time visitors can understand the page without learning commands.
- Keep the site focused on a portfolio-shaped landing page: introduction, selected projects, and links/contact.
- Make content easy to update by separating structured site data from project content.

## Non-Goals

- No full terminal emulator or command-driven navigation model.
- No internal project detail pages in this phase.
- No blog, CMS, or large multi-page information architecture in this phase.

## Current State

The current repository is a static `index.html` plus `style.css` site with a terminal-style interface, a coffee icon, a searchable command input, and a small set of easter-egg commands. It has strong personality but relies on terminal metaphors for primary interaction more than the redesign should.

## Product Direction

The redesign will follow a `hybrid terminal cafe` approach:

- Layout and reading flow behave like a modern portfolio site.
- Terminal language is expressed through visual styling, component naming, microcopy, and lightweight interactions.
- The coffee icon becomes a friendly launcher for recommended actions instead of a decorative accent or a hidden gimmick.

## Information Architecture

The site will remain primarily a single home page with scrolling sections.

### Hero

The first screen should present:

- a concise self-introduction
- a short description of what Lucas builds or cares about
- immediate access to primary actions such as viewing projects, opening GitHub, or making contact
- the coffee icon as the entry point for recommended commands

The hero should summarize the portfolio rather than trying to show everything at once. It should create a strong first impression and motivate the first scroll.

### Command Shelf

Near the hero, the site exposes a terminal-inspired action surface that does not require typing. The shelf can visually resemble a prompt, command panel, or compact palette, but all key actions must be clickable and understandable without explanation.

### Selected Projects

Projects appear below the hero in a scroll section. Each project is represented as a card with:

- project title
- short description
- stack or tags
- external destination links such as live site or repository

Projects are curated and few in number. This section should read like selected work, not like a database.

### Links / Contact

A short final section provides persistent outbound links such as GitHub, social profiles, and contact methods. It should act as a clean landing point for users who scroll past the project cards.

## Interaction Model

### Coffee Icon

The coffee icon is the main playful interaction.

- Clicking it opens a `recommended commands` panel.
- The panel lists explicit actions such as `view projects`, `open github`, `contact`, or `about lucas`.
- Selecting an item executes a clear outcome: scroll to a section, open an external link, or reveal a short block of information.

This interaction must be optional and additive. It should enrich the page, not gate access to content.

### Commands

Command styling is part of the interface language, but commands are not the primary mode of navigation. The redesign should avoid asking visitors to type in order to discover core content.

If a visible prompt-like element is used, it should behave like a guided action UI rather than a blank terminal input that assumes prior knowledge.

### Motion

Motion should be restrained and intentional:

- staggered reveal on initial load
- light hover or focus states on cards and command items
- a compact open/close animation for the recommended commands panel

Motion should support personality without adding friction.

## Visual Direction

The visual mood is `playful terminal cafe`.

### Tone

- warm, tactile, coffee-adjacent palette
- terminal and monospace references used as accents, not as a hard constraint
- a hint of humor in copy and interactions

### Layout

- readable content widths
- obvious section separation
- enough whitespace to avoid the claustrophobic feel common in terminal clones
- mobile-friendly stacking that preserves clarity

### Typography

- expressive primary type for headings
- monospace secondary type for commands, metadata, or terminal accents
- avoid default generic SaaS typography

### Decorative Language

Visual motifs may include:

- ASCII or branch-like separators
- prompt markers
- coffee-inspired iconography
- subtle panel chrome reminiscent of a terminal or cafe menu board

These motifs should support the brand without compromising legibility.

## Content Model

Content will be split by type.

### Structured Data

Use a typed data file for:

- profile metadata
- short introduction strings
- social and contact links
- recommended command definitions

This keeps frequently edited, short structured values easy to maintain.

### Project Content

Use Astro content collections with Markdown for projects.

Markdown is appropriate because project entries may evolve beyond a single sentence and benefit from text-first authoring. Since the site does not need internal project detail pages in this phase, project Markdown files act as structured sources for project cards rather than full article pages.

Each project entry should include frontmatter for at least:

- title
- summary
- tags or stack
- external URLs
- ordering or featured status

## Technical Architecture

The rebuild should use Astro as a static site.

### Page Structure

- `src/pages/index.astro` as the main page
- small focused components for hero, command shelf, project grid, and footer links
- shared layout and design tokens for consistent spacing, colors, and typography

### Client-Side Behavior

Use minimal client-side JavaScript only where it creates clear value:

- open and close the recommended commands panel
- trigger scrolling to sections
- handle simple command selection interactions

The site should remain mostly static and fast by default.

## Accessibility and Usability Requirements

- Core content must be readable without interacting with any terminal-like UI.
- Interactive elements must be keyboard accessible.
- Color contrast must remain strong even with the playful palette.
- Mobile layouts must preserve hierarchy and tappable targets.
- The coffee icon interaction must have explicit labels or accessible naming.

## Success Criteria

The redesign succeeds if:

- the site still feels recognizably like Lucas's terminal-flavored personal site
- first-time visitors can understand the page structure immediately
- the coffee icon interaction feels delightful and useful
- projects and contact paths are easier to discover than in the current static version
- content updates are straightforward through Astro data files and Markdown project entries

## Risks and Guardrails

### Risk: Too Much Terminal

If the redesign leans too hard into terminal fidelity, usability will regress. Guardrail: keep core actions visible as normal buttons, cards, or links.

### Risk: Too Generic

If the redesign becomes a standard portfolio with only superficial terminal styling, the site's personality will flatten. Guardrail: make the coffee-triggered command panel and microcopy central to the experience.

### Risk: Overbuilding

It is easy to drift into a command palette app, blog, or multi-page portfolio. Guardrail: keep scope to a home page with curated projects and link-driven actions.

## Open Decisions Resolved In This Design

- Keep terminal mood: yes
- Avoid forcing terminal interaction: yes
- Coffee icon behavior: open recommended commands
- Site scope: introduction plus selected projects plus portfolio/contact links
- Page shape: scrollable home page with a strong first screen and additional sections below
- Project presentation: cards only, no internal detail pages
- Content management: structured data for short values, Markdown content collection for projects

## Next Step

Write an implementation plan for the Astro rebuild, including project scaffolding, content migration, component architecture, interaction wiring, styling system, and verification steps.
