import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { loadOfferedCodes } from 'src/logic-functions/utils/code-activation.util';
import { loadCallContext } from 'src/logic-functions/utils/call-context.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { applyCall, defaultNextCallAt, slotWindowsOf } from 'src/utils/deal-clock.util';

// What the Log call form needs before the agent answers anything; the save re-checks all of it.
export const prepareCall = async (
  client: RecordsClient,
  actor: AgentActor,
  personId: string,
  now: Date,
) => {
  const { person, kind, deal, clock } = await loadCallContext(client, actor, personId, now);
  const reasons = await listRecords<{ id: string; kind: string; name: string; requiresText: boolean }>(
    client,
    'reasons',
    { isActive: { eq: true } },
    { kind: true, name: true, requiresText: true },
  );
  const afterCall = (answered: boolean) => {
    const applied = clock === null ? null : applyCall(clock, { now, answered }).clock;
    const target = applied === null ? undefined : slotWindowsOf(applied).find(
      ({ slot, endsAt }) => applied.slots[slot - 1] === 'PENDING' && endsAt > now,
    );

    return {
      defaultNextCallAt: defaultNextCallAt({ now, answered, clock: applied })?.toISOString() ?? null,
      deadlineAt: applied?.deadlineAt.toISOString() ?? null,
      planTargetEndsAt: target?.endsAt.toISOString() ?? null,
    };
  };

  return {
    kind,
    now: now.toISOString(),
    allowsNoNextCall: kind === 'RETENTION',
    reasons,
    codes: await loadOfferedCodes(client, { kind, deal, personId: person.id, now }),
    answered: afterCall(true),
    unanswered: afterCall(false),
  };
};
