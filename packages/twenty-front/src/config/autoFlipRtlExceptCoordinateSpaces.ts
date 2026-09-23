import type { Plugin as PostcssPlugin } from 'postcss';
import postcssRtlcss from 'postcss-rtlcss';

// These libraries draw JS-driven coordinate spaces: they position everything
// themselves and read their own physical offsets back in layout code.
// @xyflow/react pins `direction: ltr` on the canvas on purpose, and flipping
// its stylesheet moves the nodes out from under their edges. Monaco absolutely
// positions each line's spans from their static position, so a flipped
// stylesheet parks the whole viewport off-screen and the editor renders blank.
// react-grid-layout places widgets with a JS-computed translate() and
// react-resizable puts each resize handle on the physical edge it drags, as
// does our own handle component. The flipped rules are scoped to <html dir>,
// so a dir="ltr" pin on the surface cannot stop them; only exclusion can.
// All keep their physical CSS; only the content rendered inside them flips.
const COORDINATE_SPACE_STYLESHEETS =
  /node_modules[\\/](@xyflow|monaco-editor|react-grid-layout|react-resizable)[\\/]|PageLayoutGridResizeHandle\.wyw-in-js\.css/;

export const autoFlipRtlExceptCoordinateSpaces = (): PostcssPlugin => {
  const { Once: flip } = postcssRtlcss({ mode: 'override' });

  return {
    postcssPlugin: 'twenty-postcss-rtlcss',
    Once: (root, helpers) => {
      if (COORDINATE_SPACE_STYLESHEETS.test(root.source?.input.from ?? '')) {
        return;
      }

      return flip?.(root, helpers);
    },
  };
};
