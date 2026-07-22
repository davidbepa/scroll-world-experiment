# Verndale Header CTA Decoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the underline from the header's “Let's talk” CTA while preserving the underlined header navigation links.

**Architecture:** Add one narrowly scoped declaration to the CTA's existing CSS rule. Protect the behavior with a static CSS contract test, then verify the actual computed styles in the desktop browser.

**Tech Stack:** CSS, ECMAScript modules, Node.js built-in test runner, in-app browser QA.

## Global Constraints

- Work on the existing `main` branch.
- Only `.site-header .site-contact` loses its text decoration.
- Expertise, Work, Insights, About, and case-study link decoration remain unchanged.
- Preserve the CTA's shape, color, label, destination, interaction, and layout.
- Preserve unrelated untracked files: `.agents/`, `render/ChatGPT.dmg`, and `skills-lock.json`.

---

### Task 1: Remove the Header CTA Underline

**Files:**

- Create: `tests/styles.test.js`
- Modify: `src/styles.css:21`

**Interfaces:**

- Consumes: the existing `.site-header .site-contact` selector and the shared `.site-header a` decoration rule.
- Produces: a CTA-specific `text-decoration: none` override; all other anchor decoration continues through the existing cascade.

- [ ] **Step 1: Write the failing CSS contract test**

Create `tests/styles.test.js` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('header contact CTA removes only its own text decoration', () => {
  const contactRule = styles.match(/\.site-header \.site-contact\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(contactRule, /text-decoration\s*:\s*none\s*;/);
  assert.match(styles, /\.site-header a,\.poster-case a\s*\{[^}]*text-decoration-thickness\s*:\s*2px;/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails behaviorally**

Run:

```bash
node --test tests/styles.test.js
```

Expected: FAIL because the existing `.site-header .site-contact` rule contains only `color: var(--white)` and does not match `text-decoration: none`.

- [ ] **Step 3: Add the minimal scoped CSS override**

In `src/styles.css`, replace the CTA rule with:

```css
.site-header .site-contact { color:var(--white); text-decoration:none; }
```

- [ ] **Step 4: Run focused and full automated verification**

Run:

```bash
node --test tests/styles.test.js
npm test
git diff --check
```

Expected: the focused test passes; the full suite reports 35 passing tests and zero failures; `git diff --check` prints nothing.

- [ ] **Step 5: Verify computed styles in the desktop browser**

Open or reload `http://127.0.0.1:4173/` at a desktop viewport and evaluate:

```js
const contact = document.querySelector('.site-contact');
const expertise = document.querySelector('.site-header nav a');
({
  contactDecoration: getComputedStyle(contact).textDecorationLine,
  expertiseDecoration: getComputedStyle(expertise).textDecorationLine,
  contactHref: contact.href,
  contactLabel: contact.textContent.trim(),
});
```

Expected:

```js
{
  contactDecoration: 'none',
  expertiseDecoration: 'underline',
  contactHref: 'https://www.verndale.com/contact-us',
  contactLabel: "Let's talk",
}
```

Capture a desktop screenshot and visually confirm the dark CTA pill has no underline while the four text navigation links retain theirs. Confirm the browser console has no warnings or errors.

- [ ] **Step 6: Commit the verified change**

```bash
git add src/styles.css tests/styles.test.js
git commit -m "fix: remove header CTA underline"
```
