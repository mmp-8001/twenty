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
import { ADMINS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type AdminRow } from 'src/logic-functions/utils/read-admins.util';
import { serverErrorLabel, translateValue } from 'src/utils/front-labels.util';
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

const Admins = () => {
  const { t } = useTranslate();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [callerRole, setCallerRole] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await postRoute<RouteResponse>(ADMINS_ROUTE_PATH, {});

    if (result.success) {
      setAdmins(result.admins ?? []);
      setCallerRole(result.callerRole ?? null);
    } else {
      setMessage(serverErrorLabel(result.error, t('Could not load admins'), SERVER_ERRORS, t));
    }
  }, [t]);

  useEffect(() => {
    load().catch(() => setMessage(t('Could not load admins')));
  }, [load]);

  const act = async (path: string, body: Record<string, unknown>, needsReason: boolean) => {
    const reason = needsReason ? window.prompt(t('Reason')) : '';

    if (needsReason && !reason) {
      return;
    }

    const result = await postRoute<RouteResponse>(path, { ...body, reason });

    setMessage(result.success ? null : serverErrorLabel(result.error, t('Failed'), SERVER_ERRORS, t));
    await load();
  };

  const salesAdmins = admins.filter(({ roleKey }) => roleKey === 'SALES_ADMIN');

  return (
    <div style={{ padding: 16 }}>
      {message && <p role="alert">{message}</p>}
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>
              <Trans>Admin</Trans>
            </th>
            <th>
              <Trans>Role</Trans>
            </th>
            <th>
              <Trans>Status</Trans>
            </th>
            <th>
              <Trans>Users</Trans>
            </th>
            <th>
              <Trans>By state</Trans>
            </th>
            <th>
              <Trans>Actions</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.memberId}>
              <td>{admin.name}</td>
              <td>{translateValue(ROLE_LABELS, admin.roleKey, t)}</td>
              <td>
                {translateValue(ADMIN_STATUS_LABELS, admin.status, t)}
                {admin.status === 'FROZEN' &&
                  ` · ${t('{count} days', { count: admin.daysFrozen ?? 0 })}${admin.isLongFreeze ? ` (${t('long freeze')})` : ''}`}
              </td>
              <td>{admin.ownedUsers}</td>
              <td>
                {Object.entries(admin.countsByState)
                  .map(([state, count]) => `${translateValue(OWNERSHIP_STATE_LABELS, state, t)}: ${count}`)
                  .join(', ')}
              </td>
              <td style={{ display: 'flex', gap: 4 }}>
                {admin.status === 'ACTIVE' && (
                  <button type="button" onClick={() => act(FREEZE_ADMIN_ROUTE_PATH, { adminId: admin.memberId }, true)}>
                    <Trans>Freeze</Trans>
                  </button>
                )}
                {admin.status === 'FROZEN' && (
                  <button type="button" onClick={() => act(UNFREEZE_ADMIN_ROUTE_PATH, { adminId: admin.memberId }, false)}>
                    <Trans>Unfreeze</Trans>
                  </button>
                )}
                {admin.ownedUsers > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = salesAdmins.find(
                          ({ name }) => name === window.prompt(t('Transfer all to (admin name)')),
                        );

                        if (target) {
                          act(TRANSFER_USERS_ROUTE_PATH, { fromAdminId: admin.memberId, toAdminId: target.memberId }, true);
                        }
                      }}
                    >
                      <Trans>Transfer all</Trans>
                    </button>
                    <button type="button" onClick={() => act(RELEASE_USERS_ROUTE_PATH, { fromAdminId: admin.memberId }, true)}>
                      <Trans>Release all</Trans>
                    </button>
                  </>
                )}
                {callerRole === 'FULL_ADMIN' && admin.status !== 'DEACTIVATED' && (
                  <button
                    type="button"
                    disabled={admin.ownedUsers > 0}
                    onClick={() => act(DEACTIVATE_ADMIN_ROUTE_PATH, { adminId: admin.memberId }, true)}
                  >
                    <Trans>Deactivate</Trans>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: ADMINS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'admins',
  description: 'Admins with role, status and owned Users; freeze, transfer, release and deactivate.',
  component: Admins,
});
