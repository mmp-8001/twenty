import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  closeSidePanel,
  enqueueSnackbar,
  msg,
  Trans,
  unmountFrontComponent,
  useSelectedRecordIds,
  useTranslate,
} from 'twenty-sdk/front-component';

import { Tag } from 'twenty-ui/primitives/data-display';
import { Button } from 'twenty-ui/primitives/input';

import {
  Card,
  CheckboxRow,
  FieldGroup,
  FieldLabel,
  MutedText,
  Page,
  Row,
  SectionTitle,
  SelectInput,
  Stack,
  TextArea,
  TextInput,
} from 'src/front-components/components/layout';
import { ACTIVATE_OFFER_ROUTE_PATH, OFFER_OPTIONS_ROUTE_PATH } from 'src/constants/offer.constant';
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
import { activationLabel, serverErrorLabel, translateValue } from 'src/utils/front-labels.util';

const CALL_STATUS_LABELS = {
  ANSWERED: msg({ message: 'Answered', context: 'call-status' }),
  NO_ANSWER: msg({ message: 'No answer', context: 'call-status' }),
  BUSY: msg({ message: 'Busy', context: 'call-status' }),
  SWITCHED_OFF: msg({ message: 'Switched off', context: 'call-status' }),
  REJECTED: msg({ message: 'Rejected', context: 'call-status' }),
  INVALID_NUMBER: msg({ message: 'Invalid number', context: 'call-status' }),
};
const ACTIVATION_MESSAGES = {
  failed: msg('Activation failed'),
  activating: msg('Activating…'),
  used: msg('Code used'),
  deactivated: msg('Deactivated by Full Admin'),
  active: msg('Active for this user'),
  until: msg('until {until} UTC'),
  smsNotSent: msg('SMS not sent'),
};

const OFF_SCHEDULE_LABELS = {
  USER_REQUEST: msg({ message: 'User request', context: 'off-schedule-reason' }),
  ADMIN_DECISION: msg({ message: 'Agent decision', context: 'off-schedule-reason' }),
};

const CAPABILITY_LABELS = {
  DISCOUNT: msg({ message: 'Discount', context: 'offer-capability' }),
  RESET: msg({ message: 'Reset', context: 'offer-capability' }),
  INSTALLMENT: msg({ message: 'Installment', context: 'offer-capability' }),
};

type Reason = { id: string; title: string };
type SaveResponse = { success: boolean; error?: string; callId?: string };
type OfferOptionView = {
  id: string;
  title: string;
  capability: string;
  expiresAt: string | null;
  activation: { status: string; smsStatus: string } | null;
};

const SERVER_ERRORS = [
  msg('Sign in required'),
  msg('Your account is frozen or deactivated'),
  msg('You can only call users in your follow-up list'),
  msg('This user cannot be called now'),
  msg('Choose why the next call is outside the suggested window'),
  msg('You can only activate offers for users in your follow-up list'),
  msg('Offers can only be activated after an answered call'),
  msg('This offer is not available'),
  msg('This offer is already activated for this user'),
  msg('The user has no phone number'),
  msg('SMS not sent'),
];

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

const loadOfferOptions = async (callId: string): Promise<OfferOptionView[]> => {
  const result = await new RestApiClient()
    .post<{ success: boolean; options?: OfferOptionView[] }>(`/s${OFFER_OPTIONS_ROUTE_PATH}`, { callId })
    .catch(() => null);

  return result?.success ? (result.options ?? []) : [];
};

const CallForm = () => {
  const { t } = useTranslate();
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
  const [savedCall, setSavedCall] = useState<{ callId: string; options: OfferOptionView[] } | null>(null);

  useEffect(() => {
    loadReasons().then(setReasons, () =>
      enqueueSnackbar({ message: t('Could not load the reasons'), variant: 'error' }),
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
          ? { message: t('Call saved'), variant: 'success' }
          : { message: serverErrorLabel(result.error, t('Could not save the call'), SERVER_ERRORS, t), variant: 'error' },
      );

      // The code section follows an answered call, so the form stays open when there is one.
      const options =
        result.success && result.callId && isAnswered && !isMovingToFailed
          ? await loadOfferOptions(result.callId)
          : [];

      if (result.success && options.length > 0 && result.callId) {
        setSavedCall({ callId: result.callId, options });
      } else if (result.success) {
        unmountFrontComponent();
        closeSidePanel();
      }
    } catch {
      await enqueueSnackbar({ message: t('Could not save the call'), variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activateOffer = async (offerId: string) => {
    if (!savedCall) {
      return;
    }

    const result = await new RestApiClient().post<SaveResponse>(`/s${ACTIVATE_OFFER_ROUTE_PATH}`, {
      personId,
      offerId,
      callId: savedCall.callId,
    });

    await enqueueSnackbar(
      result.success
        ? { message: t('Offer activated'), variant: 'success' }
        : { message: serverErrorLabel(result.error, t('Could not activate the offer'), SERVER_ERRORS, t), variant: 'error' },
    );
    setSavedCall({ callId: savedCall.callId, options: await loadOfferOptions(savedCall.callId) });
  };

  if (savedCall) {
    return (
      <Page>
        <SectionTitle>
          <Trans>Offer codes</Trans>
        </SectionTitle>
        {savedCall.options.map((option) => {
          const label = option.activation
            ? activationLabel(
                {
                  status: option.activation.status,
                  smsStatus: option.activation.smsStatus,
                  expiresAt: option.expiresAt,
                  deactivatedAt: null,
                },
                ACTIVATION_MESSAGES,
                t,
              )
            : null;

          return (
            <Card key={option.id}>
              <Row>
                <Button
                  variant="outline"
                  disabled={option.activation !== null && option.activation.status !== 'ACTIVATION_FAILED'}
                  onClick={() => activateOffer(option.id)}
                >
                  {option.title}
                </Button>
                <Tag color="gray" variant="outline">
                  {translateValue(CAPABILITY_LABELS, option.capability, t)}
                </Tag>
                {label && <MutedText>{label}</MutedText>}
              </Row>
            </Card>
          );
        })}
        <Button
          color="accent"
          onClick={() => {
            unmountFrontComponent();
            closeSidePanel();
          }}
        >
          <Trans context="call-form">Done</Trans>
        </Button>
      </Page>
    );
  }

  const isOutsideWindow =
    nextCallAt !== '' &&
    isOutsideSuggestedWindow({
      windows: windowsFor(followupWindows, isAnswered),
      suggestedTouchNo: suggestedTouchNoFor(followupWindows, isAnswered),
      nextCallAt: new Date(nextCallAt),
    });

  return (
    <Page>
      <FieldGroup>
        <FieldLabel htmlFor="call-status">
          <Trans>How did the call go?</Trans>
        </FieldLabel>
        <SelectInput
          id="call-status"
          value={technicalStatus}
          onChange={(event) => changeTechnicalStatus(event.target.value)}
        >
          {CALL_TECHNICAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {translateValue(CALL_STATUS_LABELS, status, t)}
            </option>
          ))}
        </SelectInput>
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="call-note">
          <Trans context="call-form">Note</Trans>
        </FieldLabel>
        <TextArea id="call-note" value={note} onChange={(event) => setNote(event.target.value)} />
      </FieldGroup>
      {isAnswered && (
        <Card>
          <Stack>
            <FieldLabel as="span">
              <Trans>Feedback reasons</Trans>
            </FieldLabel>
            {reasons.feedback.map((reason) => (
              <CheckboxRow key={reason.id}>
                <input
                  type="checkbox"
                  checked={feedbackReasonIds.includes(reason.id)}
                  onChange={() => toggleFeedbackReason(reason.id)}
                />
                {reason.title}
              </CheckboxRow>
            ))}
            <FieldGroup>
              <FieldLabel htmlFor="call-other">
                <Trans>Other reason text</Trans>
              </FieldLabel>
              <TextInput
                id="call-other"
                value={feedbackOtherText}
                onChange={(event) => setFeedbackOtherText(event.target.value)}
              />
            </FieldGroup>
          </Stack>
        </Card>
      )}
      {!isMovingToFailed && (
        <>
          <FieldGroup>
            <FieldLabel htmlFor="call-next">
              <Trans>Next call</Trans>
            </FieldLabel>
            <TextInput
              id="call-next"
              type="datetime-local"
              value={nextCallAt}
              onChange={(event) => setNextCallAt(event.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="call-off-schedule">
              <Trans>Off-schedule reason</Trans>
              {isOutsideWindow ? ` ${t('(required)')}` : ''}
            </FieldLabel>
            <SelectInput
              id="call-off-schedule"
              value={offScheduleReason}
              onChange={(event) => setOffScheduleReason(event.target.value)}
            >
              <option value="">{t('None')}</option>
              {CALL_OFF_SCHEDULE_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {translateValue(OFF_SCHEDULE_LABELS, reason, t)}
                </option>
              ))}
            </SelectInput>
          </FieldGroup>
        </>
      )}
      <CheckboxRow>
        <input
          type="checkbox"
          checked={isMovingToFailed}
          onChange={(event) => setIsMovingToFailed(event.target.checked)}
        />
        <Trans>Move to failed</Trans>
      </CheckboxRow>
      {isMovingToFailed && (
        <FieldGroup>
          <FieldLabel htmlFor="call-failure">
            <Trans context="call-form">Failure reason</Trans>
          </FieldLabel>
          <SelectInput
            id="call-failure"
            value={failureReasonId}
            onChange={(event) => setFailureReasonId(event.target.value)}
          >
            <option value="">{t('Choose a reason')}</option>
            {reasons.failure.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.title}
              </option>
            ))}
          </SelectInput>
        </FieldGroup>
      )}
      <Button color="accent" onClick={submit} loading={isSubmitting} fullWidth>
        {isSubmitting ? t('Saving…') : t('Save call')}
      </Button>
    </Page>
  );
};

export default defineFrontComponent({
  universalIdentifier: CALL_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'call-form',
  description: 'End-of-call form: status, note, feedback, next call, or move to failed.',
  component: CallForm,
});
