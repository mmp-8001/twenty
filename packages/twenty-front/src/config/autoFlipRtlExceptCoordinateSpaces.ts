import type { Plugin as PostcssPlugin } from 'postcss';
import postcssRtlcss from 'postcss-rtlcss';

// A pseudo-element has to stay last in a compound selector, so :dir(rtl) goes
// in front of it. Minifiers may shorten ::before to the legacy :before form.
const PSEUDO_ELEMENT =
  /::|(?<!:):(?:before|after|first-line|first-letter)(?![\w-])/;

// The default `[dir="rtl"] .x` prefix matches through <html dir="rtl"> whatever
// dir sits in between, so a surface pinned with dir="ltr" (the dashboard grid,
// charts, the flow canvas, the code editor) would still get flipped rules.
// `.x:dir(rtl)` follows the nearest dir attribute instead, so the pin holds.
const scopeToRightToLeft = (prefix: string, selector: string) => {
  if (prefix !== '[dir="rtl"]') {
    return undefined;
  }

  const pseudoElementIndex = selector.search(PSEUDO_ELEMENT);

  return pseudoElementIndex === -1
    ? `${selector}:dir(rtl)`
    : `${selector.slice(0, pseudoElementIndex)}:dir(rtl)${selector.slice(pseudoElementIndex)}`;
};

// These libraries draw JS-driven coordinate spaces from physical offsets and
// have no RTL mode, so their stylesheets are never flipped. @xyflow/react and
// Monaco render in places not all pinned with dir="ltr". react-grid-layout and
// react-resizable style the grid items and their resize handles, which sit
// inside cards that restore the UI direction.
const COORDINATE_SPACE_STYLESHEETS =
  /node_modules[\\/](@xyflow|monaco-editor|react-grid-layout|react-resizable)[\\/]/;

export const autoFlipRtlExceptCoordinateSpaces = (): PostcssPlugin => {
  const { Once: flip } = postcssRtlcss({
    mode: 'override',
    prefixSelectorTransformer: scopeToRightToLeft,
  });

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
