import postcss from 'postcss';

import { autoFlipRtlExceptCoordinateSpaces } from '~/config/autoFlipRtlExceptCoordinateSpaces';

const CANVAS_CSS = '.react-flow { direction: ltr; }';
const EDITOR_CSS = '.monaco-editor .view-line { left: 0; }';
const GRID_HANDLE_CSS = '.react-resizable-handle-w { left: 0; }';
const APP_CSS = '.card { padding-left: 4px; }';

const process = (css: string, from: string) =>
  postcss([autoFlipRtlExceptCoordinateSpaces()]).process(css, { from }).css;

describe('autoFlipRtlExceptCoordinateSpaces', () => {
  it('leaves the flow canvas stylesheet untouched', () => {
    expect(
      process(CANVAS_CSS, '/repo/node_modules/@xyflow/react/dist/style.css'),
    ).toBe(CANVAS_CSS);
  });

  it('leaves the code editor stylesheet untouched', () => {
    expect(
      process(
        EDITOR_CSS,
        '/repo/node_modules/monaco-editor/esm/vs/editor/browser/viewParts/lines/viewLines.css',
      ),
    ).toBe(EDITOR_CSS);
  });

  it('leaves the grid resize handle stylesheet untouched', () => {
    expect(
      process(
        GRID_HANDLE_CSS,
        '/repo/node_modules/react-resizable/css/styles.css',
      ),
    ).toBe(GRID_HANDLE_CSS);
  });

  it('flips application stylesheets', () => {
    expect(
      process(APP_CSS, '/repo/packages/twenty-front/src/index.css'),
    ).toContain('.card:dir(rtl) {');
  });

  // [dir="rtl"] .card would match through <html dir="rtl"> even inside a
  // dir="ltr" pin; :dir(rtl) follows the nearest dir attribute.
  it('scopes flipped rules to the element direction, before pseudo-elements', () => {
    const css = process(
      '.a .b::before, .c:before, .d:hover { left: 0; }',
      '/repo/packages/twenty-front/src/index.css',
    );

    expect(css).toContain(
      '.a .b:dir(rtl)::before, .c:dir(rtl):before, .d:hover:dir(rtl) {',
    );
    expect(css).not.toContain('[dir="rtl"]');
  });
});
