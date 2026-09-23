import { act, renderHook } from '@testing-library/react';

import { useResizablePanel } from '@/ui/layout/resizable-panel/hooks/useResizablePanel';

const textDirectionMock = jest.fn();

jest.mock('@/localization/hooks/useTextDirection', () => ({
  useTextDirection: () => textDirectionMock(),
}));

const renderResizablePanel = (onWidthChange: jest.Mock) =>
  renderHook(() =>
    useResizablePanel({
      side: 'left',
      constraints: { min: 100, max: 1000 },
      currentWidth: 400,
      onWidthChange,
      onCollapse: jest.fn(),
    }),
  );

const dragBy = (
  result: ReturnType<typeof renderResizablePanel>['result'],
  deltaX: number,
) => {
  act(() => {
    result.current.handleMouseDown({
      clientX: 500,
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent);
  });

  act(() => {
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 500 + deltaX }),
    );
  });

  act(() => {
    document.dispatchEvent(
      new MouseEvent('mouseup', { clientX: 500 + deltaX }),
    );
  });
};

describe('useResizablePanel', () => {
  it('grows a panel whose edge is dragged away from it', () => {
    textDirectionMock.mockReturnValue('ltr');
    const onWidthChange = jest.fn();

    dragBy(renderResizablePanel(onWidthChange).result, -50);

    expect(onWidthChange).toHaveBeenCalledWith(450);
  });

  it('mirrors the pointer delta under RTL, where the edge is mirrored too', () => {
    textDirectionMock.mockReturnValue('rtl');
    const onWidthChange = jest.fn();

    dragBy(renderResizablePanel(onWidthChange).result, 50);

    expect(onWidthChange).toHaveBeenCalledWith(450);
  });
});
