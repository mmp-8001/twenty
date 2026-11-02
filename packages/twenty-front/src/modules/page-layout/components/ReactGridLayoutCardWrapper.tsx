import { forwardRef } from 'react';

export const ReactGridLayoutCardWrapper = forwardRef<
  HTMLDivElement,
  {
    key: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    dir?: 'ltr' | 'rtl';
    onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
    onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
    onMouseMove?: React.MouseEventHandler<HTMLDivElement>;
  }
>(
  (
    { children, key, className, dir, style, onMouseDown, onMouseUp, onMouseMove },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        key={key}
        data-select-disable="true"
        className={className}
        dir={dir}
        style={style}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {children}
      </div>
    );
  },
);
