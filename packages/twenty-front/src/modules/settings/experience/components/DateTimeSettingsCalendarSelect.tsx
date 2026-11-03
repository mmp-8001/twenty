import { useMemo } from 'react';

import { Select } from '@/ui/input/components/Select';
import { t } from '@lingui/core/macro';
import { type SelectOption } from 'twenty-ui/primitives/input';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

type DateTimeSettingsCalendarSelectProps = {
  value: WorkspaceMemberCalendarEnum;
  onChange: (nextValue: WorkspaceMemberCalendarEnum) => void;
};

export const DateTimeSettingsCalendarSelect = ({
  value,
  onChange,
}: DateTimeSettingsCalendarSelectProps) => {
  const options: SelectOption<WorkspaceMemberCalendarEnum>[] = useMemo(
    () => [
      { label: t`Gregorian`, value: WorkspaceMemberCalendarEnum.GREGORIAN },
      { label: t`Jalali`, value: WorkspaceMemberCalendarEnum.JALALI },
    ],
    [],
  );

  return (
    <Select
      dropdownId="datetime-settings-calendar"
      dropdownWidth={218}
      label={t`Calendar`}
      fullWidth
      dropdownWidthAuto
      value={value}
      options={options}
      onChange={onChange}
    />
  );
};
