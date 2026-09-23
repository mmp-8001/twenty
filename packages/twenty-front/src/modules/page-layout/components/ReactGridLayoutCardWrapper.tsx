import { useTextDirection } from '@/localization/hooks/useTextDirection';
import { forwardRef } from 'react';

export const ReactGridLayoutCardWrapper = forwardRef<
  HTMLDivElement,
  {
    key: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
    onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
    onMouseMove?: React.MouseEventHandler<HTMLDivElement>;
  }
>(
  (
    { children, key, className, style, onMouseDown, onMouseUp, onMouseMove },
    ref,
  ) => {
    const textDirection = useTextDirection();

    return (
      <div
        ref={ref}
        key={key}
        data-select-disable="true"
        dir={textDirection}
        className={className}
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
