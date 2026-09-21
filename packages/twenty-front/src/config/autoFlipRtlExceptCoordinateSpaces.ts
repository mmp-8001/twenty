import type { Plugin as PostcssPlugin } from 'postcss';
import postcssRtlcss from 'postcss-rtlcss';

// @xyflow/react draws a JS-driven coordinate space: it pins `direction: ltr` on
// the canvas on purpose, and its transform origins and handle offsets are read
// back by the layout code. Flipping that stylesheet moves the nodes out from
// under their edges, so the canvas keeps its physical CSS and only the content
// rendered inside it flips.
const COORDINATE_SPACE_STYLESHEETS = /node_modules[\\/]@xyflow[\\/]/;

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
