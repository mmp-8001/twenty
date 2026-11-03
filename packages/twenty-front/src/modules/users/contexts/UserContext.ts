import { type DateFormat } from '@/localization/constants/DateFormat';
import { type TimeFormat } from '@/localization/constants/TimeFormat';
import { type WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';
import { createContext } from 'react';

export type UserContextType = {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timeZone: string;
  calendar?: WorkspaceMemberCalendarEnum;
};

export const UserContext = createContext<UserContextType>(
  {} as UserContextType,
);
