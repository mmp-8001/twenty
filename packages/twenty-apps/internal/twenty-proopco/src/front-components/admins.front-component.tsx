import { useCallback, useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useTranslate } from 'twenty-sdk/front-component';

import {
  ADMINS_ROUTE_PATH,
  DEACTIVATE_ADMIN_ROUTE_PATH,
  FREEZE_ADMIN_ROUTE_PATH,
  RELEASE_USERS_ROUTE_PATH,
  TRANSFER_USERS_ROUTE_PATH,
  UNFREEZE_ADMIN_ROUTE_PATH,
} from 'src/constants/admin-management.constant';
import { IconUsers } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Button } from 'twenty-ui/primitives/input';

import {
  Card,
  Cell,
  FieldGroup,
  FieldLabel,
  HeaderCell,
  MutedText,
  Page,
  Row,
  SectionTitle,
  SelectInput,
  Stack,
  Table,
  TableWrapper,
  TextArea,
} from 'src/front-components/components/layout';
import { EmptyState, ErrorCallout, LoadingState } from 'src/front-components/components/state-views';
import { ADMINS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type AdminRow } from 'src/logic-functions/utils/read-admins.util';
import { serverErrorLabel, translateValue } from 'src/utils/front-labels.util';
import { isNotAllowedError } from 'src/utils/is-not-allowed-error.util';
import { postRoute } from 'src/utils/post-route.util';

type RouteResponse = { success: boolean; error?: string; callerRole?: string; admins?: AdminRow[] };

const SERVER_ERRORS = [
  msg('Sign in required'),
  msg('Your account is frozen or deactivated'),
  msg('A reason is required'),
  msg('You are not allowed to do this'),
  msg('This admin still owns users: transfer or release them first'),
  msg('This admin is not active'),
  msg('This admin is not frozen'),
  msg('Users can only be transferred to a Sales Admin or a Supervisor'),
  msg('Users can only be transferred to an active admin'),
];

const ROLE_LABELS = {
  SALES_ADMIN: msg({ message: 'Sales Admin', context: 'role' }),
  SUPERVISOR: msg({ message: 'Supervisor', context: 'role' }),
  FULL_ADMIN: msg({ message: 'Full Admin', context: 'role' }),
};

const ADMIN_STATUS_LABELS = {
  ACTIVE: msg({ message: 'Active', context: 'admin-status' }),
  FROZEN: msg({ message: 'Frozen', context: 'admin-status' }),
  DEACTIVATED: msg({ message: 'Deactivated', context: 'admin-status' }),
};

const OWNERSHIP_STATE_LABELS = {
  PENDING_FIRST_CALL: msg({ message: 'Pending first call', context: 'case-status' }),
  IN_FOLLOWUP: msg({ message: 'In follow-up', context: 'case-status' }),
  SUCCESSFUL: msg({ message: 'Successful', context: 'case-status' }),
  REBUY_PENDING: msg({ message: 'Rebuy pending', context: 'case-status' }),
};

type ActionKind = 'FREEZE' | 'TRANSFER' | 'RELEASE' | 'DEACTIVATE';

const ADMIN_STATUS_COLORS = { ACTIVE: 'green', FROZEN: 'yellow', DEACTIVATED: 'gray' } as const;

const Admins = () => {
  const { t } = useTranslate();
  const [admins, setAdmins] = useState<AdminRow[] | null>(null);
  const [callerRole, setCallerRole] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; isNotAllowed: boolean } | null>(null);
  const [pending, setPending] = useState<{ kind: ActionKind; admin: AdminRow } | null>(null);
  const [reason, setReason] = useState('');
  const [targetAdminId, setTargetAdminId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    const result = await postRoute<RouteResponse>(ADMINS_ROUTE_PATH, {});

    if (result.success) {
      setAdmins(result.admins ?? []);
      setCallerRole(result.callerRole ?? null);
    } else {
      setError({
        message: serverErrorLabel(result.error, t('Could not load admins'), SERVER_ERRORS, t),
        isNotAllowed: isNotAllowedError(result.error),
      });
    }
  }, [t]);

  useEffect(() => {
    load().catch(() => setError({ message: t('Could not load admins'), isNotAllowed: false }));
  }, [load]);

  const run = async (path: string, body: Record<string, unknown>) => {
    setIsSubmitting(true);

    try {
      const result = await postRoute<RouteResponse>(path, body);

      setError(
        result.success
          ? null
          : { message: serverErrorLabel(result.error, t('Failed'), SERVER_ERRORS, t), isNotAllowed: isNotAllowedError(result.error) },
      );

      if (result.success) {
        setPending(null);
        setReason('');
        setTargetAdminId('');
      }

      await load();
    } catch {
      setError({ message: t('Failed'), isNotAllowed: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAction = (kind: ActionKind, admin: AdminRow) => {
    setPending({ kind, admin });
    setReason('');
    setTargetAdminId('');
  };

  const submitPending = () => {
    if (!pending) {
      return;
    }

    const { kind, admin } = pending;

    if (kind === 'FREEZE') {
      return run(FREEZE_ADMIN_ROUTE_PATH, { adminId: admin.memberId, reason });
    }

    if (kind === 'TRANSFER') {
      return run(TRANSFER_USERS_ROUTE_PATH, { fromAdminId: admin.memberId, toAdminId: targetAdminId, reason });
    }

    if (kind === 'RELEASE') {
      return run(RELEASE_USERS_ROUTE_PATH, { fromAdminId: admin.memberId, reason });
    }

    return run(DEACTIVATE_ADMIN_ROUTE_PATH, { adminId: admin.memberId, reason });
  };

  const salesAdmins = (admins ?? []).filter(
    ({ roleKey, status, memberId }) => roleKey === 'SALES_ADMIN' && status === 'ACTIVE' && memberId !== pending?.admin.memberId,
  );
  const canSubmit = reason.trim() !== '' && (pending?.kind !== 'TRANSFER' || targetAdminId !== '');

  return (
    <Page>
      {error && (
        <ErrorCallout
          title={error.message}
          hint={error.isNotAllowed ? t('Your role does not allow this page. Ask a Full Admin to check your role.') : undefined}
        />
      )}
      {pending && (
        <Card>
          <Stack>
            <SectionTitle>
              {pending.kind === 'FREEZE' && t('Freeze {name}', { name: pending.admin.name })}
              {pending.kind === 'TRANSFER' && t('Transfer all users of {name}', { name: pending.admin.name })}
              {pending.kind === 'RELEASE' && t('Release all users of {name}', { name: pending.admin.name })}
              {pending.kind === 'DEACTIVATE' && t('Deactivate {name}', { name: pending.admin.name })}
            </SectionTitle>
            {pending.kind === 'TRANSFER' && (
              <FieldGroup>
                <FieldLabel htmlFor="admin-transfer-target">
                  <Trans>Transfer all to (admin name)</Trans>
                </FieldLabel>
                <SelectInput
                  id="admin-transfer-target"
                  value={targetAdminId}
                  onChange={(event) => setTargetAdminId(event.target.value)}
                >
                  <option value="">{t('Choose an admin')}</option>
                  {salesAdmins.map(({ memberId, name }) => (
                    <option key={memberId} value={memberId}>
                      {name}
                    </option>
                  ))}
                </SelectInput>
              </FieldGroup>
            )}
            <FieldGroup>
              <FieldLabel htmlFor="admin-action-reason">
                <Trans>Reason</Trans>
              </FieldLabel>
              <TextArea id="admin-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            </FieldGroup>
            <Row>
              <Button
                color={pending.kind === 'DEACTIVATE' ? 'danger' : 'accent'}
                disabled={!canSubmit}
                loading={isSubmitting}
                onClick={submitPending}
              >
                <Trans>Confirm</Trans>
              </Button>
              <Button variant="ghost" disabled={isSubmitting} onClick={() => setPending(null)}>
                <Trans>Cancel</Trans>
              </Button>
            </Row>
          </Stack>
        </Card>
      )}
      {admins === null ? (
        !error && <LoadingState />
      ) : admins.length === 0 ? (
        <EmptyState icon={IconUsers}>{t('No admins yet.')}</EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <HeaderCell>
                  <Trans>Admin</Trans>
                </HeaderCell>
                <HeaderCell>
                  <Trans>Role</Trans>
                </HeaderCell>
                <HeaderCell>
                  <Trans>Status</Trans>
                </HeaderCell>
                <HeaderCell>
                  <Trans>Users</Trans>
                </HeaderCell>
                <HeaderCell>
                  <Trans>By state</Trans>
                </HeaderCell>
                <HeaderCell>
                  <Trans>Actions</Trans>
                </HeaderCell>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.memberId}>
                  <Cell>{admin.name}</Cell>
                  <Cell>
                    <Tag color="blue">{translateValue(ROLE_LABELS, admin.roleKey, t)}</Tag>
                  </Cell>
                  <Cell>
                    <Row>
                      <Tag color={ADMIN_STATUS_COLORS[admin.status as keyof typeof ADMIN_STATUS_COLORS] ?? 'gray'}>
                        {translateValue(ADMIN_STATUS_LABELS, admin.status, t)}
                      </Tag>
                      {admin.status === 'FROZEN' && (
                        <MutedText>
                          {t('{count} days', { count: admin.daysFrozen ?? 0 })}
                          {admin.isLongFreeze ? ` (${t('long freeze')})` : ''}
                        </MutedText>
                      )}
                    </Row>
                  </Cell>
                  <Cell>{admin.ownedUsers}</Cell>
                  <Cell>
                    <Row>
                      {Object.entries(admin.countsByState).map(([state, count]) => (
                        <Tag key={state} color="gray" variant="outline">
                          {translateValue(OWNERSHIP_STATE_LABELS, state, t)}: {count}
                        </Tag>
                      ))}
                    </Row>
                  </Cell>
                  <Cell>
                    <Row>
                      {admin.status === 'ACTIVE' && (
                        <Button size="sm" variant="outline" onClick={() => openAction('FREEZE', admin)}>
                          <Trans>Freeze</Trans>
                        </Button>
                      )}
                      {admin.status === 'FROZEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => run(UNFREEZE_ADMIN_ROUTE_PATH, { adminId: admin.memberId })}
                        >
                          <Trans>Unfreeze</Trans>
                        </Button>
                      )}
                      {admin.ownedUsers > 0 && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openAction('TRANSFER', admin)}>
                            <Trans>Transfer all</Trans>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openAction('RELEASE', admin)}>
                            <Trans>Release all</Trans>
                          </Button>
                        </>
                      )}
                      {callerRole === 'FULL_ADMIN' && admin.status !== 'DEACTIVATED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          color="danger"
                          disabled={admin.ownedUsers > 0}
                          onClick={() => openAction('DEACTIVATE', admin)}
                        >
                          <Trans>Deactivate</Trans>
                        </Button>
                      )}
                    </Row>
                  </Cell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </Page>
  );
};

export default defineFrontComponent({
  universalIdentifier: ADMINS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'admins',
  description: 'Admins with role, status and owned Users; freeze, transfer, release and deactivate.',
  component: Admins,
});
