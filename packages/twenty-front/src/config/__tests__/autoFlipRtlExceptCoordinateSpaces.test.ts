import postcss from 'postcss';

import { autoFlipRtlExceptCoordinateSpaces } from '../autoFlipRtlExceptCoordinateSpaces';

const CANVAS_CSS = '.react-flow { direction: ltr; }';
const APP_CSS = '.card { padding-left: 4px; }';

const process = (css: string, from: string) =>
  postcss([autoFlipRtlExceptCoordinateSpaces()]).process(css, { from }).css;

describe('autoFlipRtlExceptCoordinateSpaces', () => {
  it('leaves the flow canvas stylesheet untouched', () => {
    expect(
      process(CANVAS_CSS, '/repo/node_modules/@xyflow/react/dist/style.css'),
    ).toBe(CANVAS_CSS);
  });

  it('flips application stylesheets', () => {
    expect(
      process(APP_CSS, '/repo/packages/twenty-front/src/index.css'),
    ).toContain('[dir="rtl"]');
  });
});
