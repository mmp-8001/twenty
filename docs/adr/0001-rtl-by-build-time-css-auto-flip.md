# Right-to-left layout by build-time CSS auto-flip

`twenty-front` carries ~551 physical direction declarations (`margin-left`, `padding-right`, `left:`) across ~295 files. Rather than migrate them to logical properties, this fork adds `postcss-rtlcss({ mode: 'override' })` to `packages/twenty-front/vite.config.ts`, which generates `[dir="rtl"]`-scoped overrides at build time from the existing physical CSS. No source file changes; direction is driven entirely by the `dir` attribute on `<html>`.

## Considered options

A codemod rewriting all 551 declarations to logical properties was the obvious alternative, and is what upstream's RTL wiring commit (`a3c77035da`) names as the remaining work. It was rejected for one reason specific to this fork: it is a ~295-file diff, and this is a long-lived private fork that rebases on `twentyhq/twenty`. That diff would conflict with a large share of every upstream styling change, indefinitely. The auto-flip achieves the same user-visible result with a 14-line diff in a file upstream rarely touches.

## Consequences

- **Do not delete this as dead config.** It looks like an unused PostCSS plugin. It is the entire RTL implementation.
- `mode: 'override'` leaves LTR output byte-identical, so English cannot regress from this.
- Auto-flip cannot know when a physical direction is intentional. Files where a `transform` partners with `left`/`right` (~20 in `twenty-front`) need `/* rtl:ignore */`, as does any hand-authored RTL block.
- It cannot touch non-CSS direction: SVG icon geometry, `@floating-ui` placement, and drag-and-drop axes are handled separately in `src/index.css` and `flipPlacementForDirection`.
- New code should still prefer logical properties. The auto-flip carries the existing CSS; it is not a reason to keep writing physical ones.
