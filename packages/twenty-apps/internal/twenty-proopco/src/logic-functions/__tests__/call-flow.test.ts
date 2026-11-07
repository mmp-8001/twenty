import { describe, expect, it } from 'vitest';

import {
  deadlineAfterCall,
  planFirstAnsweredCall,
  planMoveToFailed,
  selectFormVariant,
  validateCallForm,
} from 'src/logic-functions/utils/call-flow.util';

const NOW = new Date('2026-03-01T10:00:00.000Z');
const DEADLINE = new Date('2026-03-31T10:00:00.000Z');
const reasons = new Map([
  ['ok', { isActive: true }],
  ['other', { isActive: true, isOther: true }],
  ['off', { isActive: false }],
]);
const validate = (
  input: Partial<Parameters<typeof validateCallForm>[0]['input']>,
  kind: 'FOLLOWUP' | 'RETENTION' = 'FOLLOWUP',
  failureReason?: { isActive: boolean },
) =>
  validateCallForm({
    input: { technicalStatus: 'ANSWERED', feedbackReasonIds: ['ok'], ...input },
    kind,
    deadline: DEADLINE,
    feedbackReasons: reasons,
    failureReason,
  });

describe('selectFormVariant', () => {
  it.each([
    [{ technicalStatus: 'BUSY' }, 'unanswered'],
    [{ technicalStatus: 'ANSWERED' }, 'ANSWERED'],
    [{ technicalStatus: 'BUSY', failureReasonId: 'f' }, 'FAILED'],
  ])('%j is %s', (input, variant) => {
    expect(selectFormVariant(input)).toBe(variant);
  });
});

describe('validateCallForm', () => {
  it('accepts an answered call with a reason and a next time', () => {
    expect(validate({ nextCallAt: '2026-03-05T10:00:00.000Z' })).toBeNull();
  });

  it('requires a next time on an unanswered call', () => {
    expect(validate({ technicalStatus: 'BUSY', feedbackReasonIds: [] })).toMatch(/next call/);
  });

  it('rejects feedback reasons on an unanswered call', () => {
    expect(
      validate({ technicalStatus: 'BUSY', nextCallAt: '2026-03-05T10:00:00.000Z' }),
    ).toMatch(/answered calls/);
  });

  it('requires a feedback reason on an answered call', () => {
    expect(validate({ feedbackReasonIds: [], nextCallAt: '2026-03-05T10:00:00.000Z' })).toMatch(
      /feedback reason/,
    );
  });

  it('rejects an inactive or unknown reason', () => {
    expect(validate({ feedbackReasonIds: ['off'], nextCallAt: '2026-03-05T10:00:00.000Z' })).toMatch(/active/);
    expect(validate({ feedbackReasonIds: ['nope'], nextCallAt: '2026-03-05T10:00:00.000Z' })).toMatch(/active/);
  });

  it('requires text for the other reason', () => {
    const nextCallAt = '2026-03-05T10:00:00.000Z';

    expect(validate({ feedbackReasonIds: ['other'], nextCallAt })).toMatch(/other reason/);
    expect(validate({ feedbackReasonIds: ['other'], feedbackOtherText: 'why', nextCallAt })).toBeNull();
  });

  it('rejects a next time after the deadline', () => {
    expect(validate({ nextCallAt: '2026-04-01T10:00:00.000Z' })).toMatch(/deadline/);
  });

  it('makes the next time optional on an answered retention call', () => {
    expect(validate({}, 'RETENTION')).toBeNull();
  });

  it('needs an active failure reason and drops the next time when failing', () => {
    expect(validate({ technicalStatus: 'BUSY', feedbackReasonIds: [], failureReasonId: 'f' })).toMatch(
      /failure reason/,
    );
    expect(
      validate({ technicalStatus: 'BUSY', feedbackReasonIds: [], failureReasonId: 'f' }, 'FOLLOWUP', {
        isActive: true,
      }),
    ).toBeNull();
  });

  it('still needs feedback reasons when an answered call is moved to failed', () => {
    expect(
      validate({ feedbackReasonIds: [], failureReasonId: 'f' }, 'FOLLOWUP', { isActive: true }),
    ).toMatch(/feedback reason/);
  });
});

describe('first answered call', () => {
  it('starts the 30 days from that call', () => {
    const plan = planFirstAnsweredCall({ followupStatus: 'PENDING_FIRST_CALL', isAnswered: true, now: NOW });

    expect(plan?.followup).toEqual({
      status: 'IN_PROGRESS',
      firstAnsweredCallAt: NOW.toISOString(),
      deadlineAt: DEADLINE.toISOString(),
    });
    expect(plan?.ownershipState).toBe('IN_FOLLOWUP');
  });

  it.each([
    ['PENDING_FIRST_CALL', false],
    ['IN_PROGRESS', true],
  ])('changes nothing for %s answered=%s', (followupStatus, isAnswered) => {
    expect(planFirstAnsweredCall({ followupStatus, isAnswered, now: NOW })).toBeNull();
  });

  it('checks the next time against the new deadline', () => {
    const deadline = deadlineAfterCall({
      status: 'PENDING_FIRST_CALL',
      deadlineAt: '2026-03-08T10:00:00.000Z',
      isAnswered: true,
      now: NOW,
    });

    expect(deadline).toEqual(DEADLINE);
  });
});

describe('planMoveToFailed', () => {
  it('closes the case and the ownership and fails the person', () => {
    const plan = planMoveToFailed({ failureReasonId: 'f', now: NOW });

    expect(plan.followup).toMatchObject({ status: 'FAILED', failureReasonId: 'f', openKey: null });
    expect(plan.ownership).toMatchObject({ endReason: 'FAILED', openUserKey: null });
    expect(plan.person).toEqual({ permanentlyFailedAt: NOW.toISOString(), currentOwnerId: null });
  });
});
