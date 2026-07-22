# Verndale Header CTA Decoration Design

Date: 2026-07-22  
Status: Approved

## Objective

Remove the text underline from the header's “Let's talk” CTA without changing the appearance of the adjacent Expertise, Work, Insights, or About navigation links.

## Design

Add `text-decoration: none` to the existing `.site-header .site-contact` rule in `src/styles.css`. This selector already owns the CTA's white text treatment, so it is the narrowest place to override the broader `.site-header a` decoration rule.

The CTA keeps its current dark pill, spacing, typography, color, hover behavior, focus behavior, URL, and position. Header navigation links continue to use their current underline thickness and offset.

## Verification

- Add a CSS contract test proving `.site-header .site-contact` declares `text-decoration: none`.
- Keep the existing full test suite green.
- In the desktop browser, confirm the CTA's computed `text-decoration-line` is `none` while the Expertise navigation link remains `underline`.

## Out of Scope

- Removing underlines from navigation links or case-study links
- Changing the CTA shape, color, label, destination, interaction, or layout
- Changing poster-mode or mobile navigation behavior
