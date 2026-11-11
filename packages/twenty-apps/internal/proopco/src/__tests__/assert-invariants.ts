import { CoreApiClient } from 'twenty-client-sdk/core';
import { expect } from 'vitest';

import { MAX_ATTEMPTS } from 'src/constants/platform-events.constant';
import { listRecords } from 'src/logic-functions/utils/records.util';

type InboxRow = {
  eventId: string;
  status: string;
  lastError: string | null;
  attempts: number;
  needsReview: boolean;
};

// Each ticket adds the invariants of the objects it introduces (PRD "Invariants" 1-10).
export const assertInvariants = async (client: CoreApiClient) => {
  const failed = await listRecords<InboxRow>(
    client,
    'platformEventInboxes',
    { status: { eq: 'FAILED' } },
    { eventId: true, status: true, lastError: true, attempts: true, needsReview: true },
  );

  for (const row of failed) {
    expect(row.lastError, `Failed event ${row.eventId} has a reason`).toBeTruthy();

    if (row.attempts >= MAX_ATTEMPTS) {
      expect(row.needsReview, `Failed event ${row.eventId} is flagged for review`).toBe(true);
    }
  }

  const eligiblePeople = await listRecords<{
    lifecycleStage: string | null;
    ownerId: string | null;
  }>(
    client,
    'people',
    { eligibleMemberIds: { isEmptyArray: false } },
    { lifecycleStage: true, ownerId: true },
  );

  for (const person of eligiblePeople) {
    expect(person.lifecycleStage, 'Only a Free contact has eligible members').toBe('FREE');
    expect(person.ownerId, 'An eligible contact has no owner').toBeNull();
  }

  const openDeals = await listRecords<{
    openDealKey: string;
    dealStage: string;
    pointOfContactId: string | null;
  }>(
    client,
    'opportunities',
    { openDealKey: { is: 'NOT_NULL' } },
    { openDealKey: true, dealStage: true, pointOfContactId: true },
  );

  for (const deal of openDeals) {
    expect(
      ['AWAITING_FIRST_CALL', 'IN_FOLLOW_UP', 'REBUY_WINDOW'],
      'Only an open deal holds the open deal key',
    ).toContain(deal.dealStage);
    expect(deal.openDealKey, 'The open deal key is the contact id').toBe(deal.pointOfContactId);
  }

  const unowned = await listRecords<{ lifecycleStage: string; ownerId: string | null; cooldownUntil: string | null }>(
    client,
    'people',
    { lifecycleStage: { in: ['FREE', 'COOL_DOWN'] } },
    { lifecycleStage: true, ownerId: true, cooldownUntil: true },
  );

  for (const person of unowned) {
    expect(person.ownerId, `A ${person.lifecycleStage} contact has no owner`).toBeNull();
  }

  for (const person of unowned.filter(({ lifecycleStage }) => lifecycleStage === 'COOL_DOWN')) {
    expect(person.cooldownUntil, 'A Cool-down contact has an end').toBeTruthy();
  }

  // Invariant 8: a code is never activated twice for one contact and activations are never deleted.
  const activations = await listRecords<{
    activationKey: string;
    codeId: string;
    contactId: string;
    status: string;
    lastError: string | null;
    activatedAt: string | null;
  }>(
    client,
    'codeActivations',
    {},
    { activationKey: true, codeId: true, contactId: true, status: true, lastError: true, activatedAt: true },
  );

  expect(new Set(activations.map(({ activationKey }) => activationKey)).size, 'One activation per code and contact').toBe(
    activations.length,
  );

  for (const activation of activations) {
    expect(activation.activationKey).toBe(`${activation.codeId}:${activation.contactId}`);

    if (activation.status === 'FAILED') {
      expect(activation.lastError, 'A Failed activation has a reason').toBeTruthy();
    }

    if (activation.status === 'ACTIVE') {
      expect(activation.activatedAt, 'An Active activation has a time').toBeTruthy();
    }
  }

  // Invariant 9: a deactivated agent owns nothing.
  const inactiveAgents = await listRecords<{ id: string; name: string }>(client, 'agents', { isActive: { eq: false } }, { name: true });

  for (const agent of inactiveAgents) {
    const owned = await listRecords<{ id: string }>(
      client,
      'people',
      { and: [{ ownerId: { eq: agent.id } }, { deletedAt: { is: 'NULL' } }] },
      {},
      1,
    );

    expect(owned, `Inactive agent ${agent.name} owns no contacts`).toEqual([]);
  }

  // Invariant 5: a transfer or release closes the old deal as Void with its reason; a closed deal holds no key.
  const voided = await listRecords<{ closeReason: string | null; openDealKey: string | null }>(
    client,
    'opportunities',
    { dealStage: { eq: 'VOID' } },
    { closeReason: true, openDealKey: true },
  );

  for (const deal of voided) {
    expect(deal.closeReason, 'A Void deal says why').toBeTruthy();
    expect(deal.openDealKey || null).toBeNull();
  }

  const failedAudits = await listRecords<{ lastError: string | null }>(client, 'auditLogs', { status: { eq: 'FAILED' } }, { lastError: true });

  for (const audit of failedAudits) {
    expect(audit.lastError, 'A Failed operation has a reason').toBeTruthy();
  }
};
