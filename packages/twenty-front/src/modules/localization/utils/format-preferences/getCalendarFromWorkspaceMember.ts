import { type CurrentWorkspaceMember } from '@/auth/states/currentWorkspaceMemberState';
import { type WorkspaceMember } from '@/workspace-member/types/WorkspaceMember';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

export const getCalendarFromWorkspaceMember = (
  workspaceMember: WorkspaceMember | CurrentWorkspaceMember,
): WorkspaceMemberCalendarEnum =>
  workspaceMember.calendar ?? WorkspaceMemberCalendarEnum.GREGORIAN;
