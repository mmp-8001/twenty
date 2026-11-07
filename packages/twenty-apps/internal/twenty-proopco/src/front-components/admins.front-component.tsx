import { useCallback, useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';

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

type RouteResponse = { success: boolean; error?: string; callerRole?: string; admins?: AdminRow[] };

const post = (path: string, body: unknown) => new RestApiClient().post<RouteResponse>(`/s${path}`, body);

const Admins = () => {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [callerRole, setCallerRole] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await post(ADMINS_ROUTE_PATH, {});

    if (result.success) {
      setAdmins(result.admins ?? []);
      setCallerRole(result.callerRole ?? null);
    } else {
      setMessage(result.error ?? 'Could not load admins');
    }
  }, []);

  useEffect(() => {
    load().catch(() => setMessage('Could not load admins'));
  }, [load]);

  const act = async (path: string, body: Record<string, unknown>, needsReason: boolean) => {
    const reason = needsReason ? window.prompt('Reason') : '';

    if (needsReason && !reason) {
      return;
    }

    const result = await post(path, { ...body, reason });

    setMessage(result.success ? null : (result.error ?? 'Failed'));
    await load();
  };

  const salesAdmins = admins.filter(({ roleKey }) => roleKey === 'SALES_ADMIN');

  return (
    <div style={{ padding: 16 }}>
      {message && <p role="alert">{message}</p>}
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Admin</th>
            <th>Role</th>
            <th>Status</th>
            <th>Users</th>
            <th>By state</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.memberId}>
              <td>{admin.name}</td>
              <td>{admin.roleKey.replace('_', ' ').toLowerCase()}</td>
              <td>
                {admin.status.toLowerCase()}
                {admin.status === 'FROZEN' && ` · ${admin.daysFrozen ?? 0} days${admin.isLongFreeze ? ' (long freeze)' : ''}`}
              </td>
              <td>{admin.ownedUsers}</td>
              <td>
                {Object.entries(admin.countsByState)
                  .map(([state, count]) => `${state.replace(/_/g, ' ').toLowerCase()}: ${count}`)
                  .join(', ')}
              </td>
              <td style={{ display: 'flex', gap: 4 }}>
                {admin.status === 'ACTIVE' && (
                  <button type="button" onClick={() => act(FREEZE_ADMIN_ROUTE_PATH, { adminId: admin.memberId }, true)}>
                    Freeze
                  </button>
                )}
                {admin.status === 'FROZEN' && (
                  <button type="button" onClick={() => act(UNFREEZE_ADMIN_ROUTE_PATH, { adminId: admin.memberId }, false)}>
                    Unfreeze
                  </button>
                )}
                {admin.ownedUsers > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = salesAdmins.find(
                          ({ name }) => name === window.prompt('Transfer all to (admin name)'),
                        );

                        if (target) {
                          act(TRANSFER_USERS_ROUTE_PATH, { fromAdminId: admin.memberId, toAdminId: target.memberId }, true);
                        }
                      }}
                    >
                      Transfer all
                    </button>
                    <button type="button" onClick={() => act(RELEASE_USERS_ROUTE_PATH, { fromAdminId: admin.memberId }, true)}>
                      Release all
                    </button>
                  </>
                )}
                {callerRole === 'FULL_ADMIN' && admin.status !== 'DEACTIVATED' && (
                  <button
                    type="button"
                    disabled={admin.ownedUsers > 0}
                    onClick={() => act(DEACTIVATE_ADMIN_ROUTE_PATH, { adminId: admin.memberId }, true)}
                  >
                    Deactivate
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
