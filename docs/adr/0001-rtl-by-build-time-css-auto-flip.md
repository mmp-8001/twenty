# Right-to-left layout by build-time CSS auto-flip

`twenty-front` carries ~551 physical direction declarations (`margin-left`, `padding-right`, `left:`) across ~295 files. Rather than migrate them to logical properties, this fork adds `postcss-rtlcss({ mode: 'override' })` to `packages/twenty-front/vite.config.ts`, which generates `[dir="rtl"]`-scoped overrides at build time from the existing physical CSS. No source file changes; direction is driven entirely by the `dir` attribute on `<html>`.

## Considered options

A codemod rewriting all 551 declarations to logical properties was the obvious alternative, and is what upstream's RTL wiring commit (`a3c77035da`) names as the remaining work. It was rejected for one reason specific to this fork: it is a ~295-file diff, and this is a long-lived private fork that rebases on `twentyhq/twenty`. That diff would conflict with a large share of every upstream styling change, indefinitely. The auto-flip achieves the same user-visible result with a 14-line diff in a file upstream rarely touches.

## Consequences

- **Do not delete this as dead config.** It looks like an unused PostCSS plugin. It is the entire RTL implementation.
- `mode: 'override'` leaves LTR output byte-identical, so English cannot regress from this.
- Auto-flip cannot know when a physical direction is intentional. Files where a `transform` partners with `left`/`right` (~20 in `twenty-front`) need `/* rtl:ignore */`, as does any hand-authored RTL block.
- Stylesheets that describe a coordinate space rather than a reading order must be excluded, not flipped. `@xyflow/react` pins `direction: ltr` on the canvas on purpose and positions nodes from a static position plus a JS-computed `translate()`; flipping it moved every node out from under its edges. Monaco has no RTL mode either and places each line from its static position, so flipping left the code editor blank. `autoFlipRtlExceptCoordinateSpaces` skips those files, and the editor container pins `direction: ltr` so Monaco does not inherit one.
- Coordinate spaces and data viz keep a left-to-right layout direction: anything that positions content from JS-computed physical coordinates or plots data on axes. That covers the page-layout grid (dashboards and record-page tabs), chart widgets, the settings charts, the flow canvas and the code editor. Text, lists, forms, navigation and chrome mirror. The surface's container carries `dir="ltr"` and the content inside it restores `dir` from `useTextDirection()`: grid cards, and chart tooltips, which stay right-to-left while being positioned in the chart's left-to-right coordinates. Under `dir="rtl"`, react-grid-layout's `translate()` starts from the right-hand static position, so without the pin half the grid rendered off-screen.
- A `dir="ltr"` pin does not stop the auto-flip. The generated overrides are `[dir="rtl"] .x` descendant rules, which match through `<html dir="rtl">` whatever `dir` sits in between. Stylesheets inside a pinned surface that must keep their physical sides (react-grid-layout, react-resizable, `PageLayoutGridResizeHandle`) are excluded in `autoFlipRtlExceptCoordinateSpaces` too. `rtl:ignore` is not an option for Linaria styles: wyw-in-js strips comments before PostCSS sees them.
- It cannot touch non-CSS direction: SVG icon geometry, `@floating-ui` placement, and drag-and-drop axes are handled separately in `src/index.css` and `flipPlacementForDirection`.
- New code should still prefer logical properties. The auto-flip carries the existing CSS; it is not a reason to keep writing physical ones.
