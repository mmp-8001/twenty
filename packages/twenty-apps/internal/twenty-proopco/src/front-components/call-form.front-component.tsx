import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  closeSidePanel,
  enqueueSnackbar,
  unmountFrontComponent,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import {
  CALL_OFF_SCHEDULE_REASONS,
  CALL_TECHNICAL_STATUSES,
  RECORD_CALL_ROUTE_PATH,
} from 'src/constants/ownership.constant';
import { CALL_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  buildTouchWindows,
  defaultNextCallAt,
  isOutsideSuggestedWindow,
  suggestTouchNo,
  type TouchWindow,
} from 'src/utils/call-windows.util';

type Reason = { id: string; title: string };
type SaveResponse = { success: boolean; error?: string };

const loadReasons = async (): Promise<{ feedback: Reason[]; failure: Reason[] }> => {
  const result = (await new CoreApiClient().query({
    feedbackReasons: {
      __args: { filter: { isActive: { eq: true } }, first: 100, orderBy: [{ sortOrder: 'AscNullsFirst' }] },
      edges: { node: { id: true, title: true } },
    },
    failureReasons: {
      __args: { filter: { isActive: { eq: true } }, first: 100, orderBy: [{ sortOrder: 'AscNullsFirst' }] },
      edges: { node: { id: true, title: true } },
    },
  } as never)) as unknown as Record<string, { edges: { node: Reason }[] }>;

  return {
    feedback: result.feedbackReasons.edges.map(({ node }) => node),
    failure: result.failureReasons.edges.map(({ node }) => node),
  };
};

type FollowupWindows = { status: string; touches: TouchWindow[] };

const loadFollowupWindows = async (personId: string): Promise<FollowupWindows | null> => {
  const client = new CoreApiClient();
  const { followups } = (await client.query({
    followups: {
      __args: { filter: { personId: { eq: personId }, openKey: { eq: personId } }, first: 1 },
      edges: { node: { id: true, status: true } },
    },
  } as never)) as unknown as { followups: { edges: { node: { id: string; status: string } }[] } };
  const followup = followups.edges[0]?.node;

  if (!followup) {
    return null;
  }

  const { touches } = (await client.query({
    touches: {
      __args: { filter: { followupId: { eq: followup.id } }, first: 5 },
      edges: { node: { touchNo: true, windowStartAt: true, windowEndAt: true } },
    },
  } as never)) as unknown as {
    touches: { edges: { node: { touchNo: number; windowStartAt: string; windowEndAt: string } }[] };
  };

  return {
    status: followup.status,
    touches: touches.edges.map(({ node }) => ({
      touchNo: node.touchNo,
      windowStartAt: new Date(node.windowStartAt),
      windowEndAt: new Date(node.windowEndAt),
    })),
  };
};

const toLocalInputValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

const CallForm = () => {
  const [personId] = useSelectedRecordIds();
  const [reasons, setReasons] = useState<{ feedback: Reason[]; failure: Reason[] }>({
    feedback: [],
    failure: [],
  });
  const [technicalStatus, setTechnicalStatus] = useState('ANSWERED');
  const [note, setNote] = useState('');
  const [feedbackReasonIds, setFeedbackReasonIds] = useState<string[]>([]);
  const [feedbackOtherText, setFeedbackOtherText] = useState('');
  const [nextCallAt, setNextCallAt] = useState('');
  const [offScheduleReason, setOffScheduleReason] = useState('');
  const [isMovingToFailed, setIsMovingToFailed] = useState(false);
  const [failureReasonId, setFailureReasonId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followupWindows, setFollowupWindows] = useState<FollowupWindows | null>(null);

  useEffect(() => {
    loadReasons().then(setReasons, () =>
      enqueueSnackbar({ message: 'Could not load the reasons', variant: 'error' }),
    );
  }, []);

  // The windows an answered first call would create are not stored yet, so they are built from now.
  const windowsFor = (loaded: FollowupWindows | null, answered: boolean) =>
    loaded?.status === 'PENDING_FIRST_CALL'
      ? answered
        ? buildTouchWindows(new Date())
        : []
      : (loaded?.touches ?? []);

  const suggestedTouchNoFor = (loaded: FollowupWindows | null, answered: boolean) =>
    suggestTouchNo({ windows: windowsFor(loaded, answered), now: new Date(), isAnswered: answered });

  const applyDefaultNextCall = (loaded: FollowupWindows | null, status: string) => {
    const answered = status === 'ANSWERED';
    const suggested = defaultNextCallAt({
      windows: windowsFor(loaded, answered),
      suggestedTouchNo: suggestedTouchNoFor(loaded, answered),
      now: new Date(),
    });

    setNextCallAt(suggested ? toLocalInputValue(suggested) : '');
  };

  useEffect(() => {
    if (personId) {
      loadFollowupWindows(personId).then(
        (loaded) => {
          setFollowupWindows(loaded);
          applyDefaultNextCall(loaded, 'ANSWERED');
        },
        () => setFollowupWindows(null),
      );
    }
  }, [personId]);

  const changeTechnicalStatus = (status: string) => {
    setTechnicalStatus(status);
    applyDefaultNextCall(followupWindows, status);
  };

  const isAnswered = technicalStatus === 'ANSWERED';

  const toggleFeedbackReason = (id: string) =>
    setFeedbackReasonIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    );

  const submit = async () => {
    setIsSubmitting(true);

    try {
      const result = await new RestApiClient().post<SaveResponse>(`/s${RECORD_CALL_ROUTE_PATH}`, {
        personId,
        technicalStatus,
        note,
        feedbackReasonIds: isAnswered ? feedbackReasonIds : [],
        feedbackOtherText,
        nextCallAt: isMovingToFailed || nextCallAt === '' ? null : new Date(nextCallAt).toISOString(),
        offScheduleReason: offScheduleReason || null,
        failureReasonId: isMovingToFailed ? failureReasonId : null,
      });

      await enqueueSnackbar(
        result.success
          ? { message: 'Call saved', variant: 'success' }
          : { message: result.error ?? 'Could not save the call', variant: 'error' },
      );

      if (result.success) {
        unmountFrontComponent();
        closeSidePanel();
      }
    } catch {
      await enqueueSnackbar({ message: 'Could not save the call', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
      <label htmlFor="call-status">How did the call go?</label>
      <select
        id="call-status"
        value={technicalStatus}
        onChange={(event) => changeTechnicalStatus(event.target.value)}
      >
        {CALL_TECHNICAL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status.replace(/_/g, ' ').toLowerCase()}
          </option>
        ))}
      </select>
      <label htmlFor="call-note">Note</label>
      <textarea id="call-note" value={note} onChange={(event) => setNote(event.target.value)} />
      {isAnswered && (
        <fieldset>
          <legend>Feedback reasons</legend>
          {reasons.feedback.map((reason) => (
            <label key={reason.id} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={feedbackReasonIds.includes(reason.id)}
                onChange={() => toggleFeedbackReason(reason.id)}
              />
              {reason.title}
            </label>
          ))}
          <label htmlFor="call-other">Other reason text</label>
          <input
            id="call-other"
            value={feedbackOtherText}
            onChange={(event) => setFeedbackOtherText(event.target.value)}
          />
        </fieldset>
      )}
      {!isMovingToFailed && (
        <>
          <label htmlFor="call-next">Next call</label>
          <input
            id="call-next"
            type="datetime-local"
            value={nextCallAt}
            onChange={(event) => setNextCallAt(event.target.value)}
          />
          <label htmlFor="call-off-schedule">
            Off-schedule reason
            {nextCallAt !== '' &&
            isOutsideSuggestedWindow({
              windows: windowsFor(followupWindows, isAnswered),
              suggestedTouchNo: suggestedTouchNoFor(followupWindows, isAnswered),
              nextCallAt: new Date(nextCallAt),
            })
              ? ' (required)'
              : ''}
          </label>
          <select
            id="call-off-schedule"
            value={offScheduleReason}
            onChange={(event) => setOffScheduleReason(event.target.value)}
          >
            <option value="">None</option>
            {CALL_OFF_SCHEDULE_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </>
      )}
      <label>
        <input
          type="checkbox"
          checked={isMovingToFailed}
          onChange={(event) => setIsMovingToFailed(event.target.checked)}
        />
        Move to failed
      </label>
      {isMovingToFailed && (
        <>
          <label htmlFor="call-failure">Failure reason</label>
          <select
            id="call-failure"
            value={failureReasonId}
            onChange={(event) => setFailureReasonId(event.target.value)}
          >
            <option value="">Choose a reason</option>
            {reasons.failure.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.title}
              </option>
            ))}
          </select>
        </>
      )}
      <button type="button" onClick={submit} disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save call'}
      </button>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: CALL_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'call-form',
  description: 'End-of-call form: status, note, feedback, next call, or move to failed.',
  component: CallForm,
});
