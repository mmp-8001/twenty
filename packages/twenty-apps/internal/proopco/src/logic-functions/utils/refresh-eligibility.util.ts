import { isDefined } from 'twenty-sdk/utils';

import {
  loadEligibilityPlan,
  recomputeAllEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import {
  readSegmentRule,
  type MetadataClient,
} from 'src/logic-functions/utils/read-segment-rule.util';
import {
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import {
  computeCampaignStatus,
  yesterdayInTehran,
} from 'src/utils/campaign-status.util';

type CampaignRow = { startsAt: string; endsAt: string | null; status: string };

export const refreshCampaignStatuses = async (
  client: RecordsClient,
  now: Date,
): Promise<number> => {
  const campaigns = await listRecords<CampaignRow & { id: string }>(
    client,
    'campaigns',
    {},
    { startsAt: true, endsAt: true, status: true },
  );
  let changed = 0;

  for (const campaign of campaigns) {
    const status = computeCampaignStatus(campaign, now);

    if (status !== campaign.status) {
      await updateRecord(client, 'Campaign', campaign.id, { status });
      changed += 1;
    }
  }

  return changed;
};

// An invalid rule is reported on the Segment and grants nothing; it is never repaired silently.
export const validateSegments = async (
  client: RecordsClient,
  metadata: MetadataClient,
): Promise<number> => {
  const segments = await listRecords<{
    id: string;
    viewId: string | null;
    validationError: string | null;
  }>(client, 'segments', {}, { viewId: true, validationError: true });
  let changed = 0;

  for (const segment of segments) {
    const rule = segment.viewId
      ? await readSegmentRule(metadata, segment.viewId)
      : ({ isValid: false, error: 'Choose a view for this segment' } as const);
    const validationError = rule.isValid ? null : rule.error;

    if ((segment.validationError || null) !== validationError) {
      await updateRecord(client, 'Segment', segment.id, { validationError });
      changed += 1;
    }
  }

  return changed;
};

export const runEligibilityRefresh = async (
  now: Date,
  client: RecordsClient,
  metadata: MetadataClient,
) => {
  const campaignsChanged = await refreshCampaignStatuses(client, now);
  const segmentsChanged = await validateSegments(client, metadata);
  const plan = await loadEligibilityPlan(client, metadata);
  const contactsChanged = await recomputeAllEligibility(client, plan);

  return { campaignsChanged, segmentsChanged, contactsChanged };
};

export const endCampaignNow = async (
  client: RecordsClient,
  campaignId: string,
  now: Date,
): Promise<void> => {
  const [campaign] = await listRecords<CampaignRow>(
    client,
    'campaigns',
    { id: { eq: campaignId } },
    { startsAt: true, endsAt: true, status: true },
    1,
  );

  if (!isDefined(campaign)) {
    throw new Error('Campaign not found');
  }

  const endsAt = yesterdayInTehran(now);

  await updateRecord(client, 'Campaign', campaignId, {
    endsAt,
    status: computeCampaignStatus({ ...campaign, endsAt }, now),
  });
};
