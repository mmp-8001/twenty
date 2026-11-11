import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  msg,
  openCommandConfirmationModal,
  t,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { type RefusalCode } from 'src/constants/refusal-codes.constant';
import { MARK_INCOME_UNPAID_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

type IncomeResult = { succeeded: string[]; failed: { incomeId: string; code: RefusalCode; message: string }[] };

const ERROR_MESSAGES: Partial<Record<RefusalCode, ReturnType<typeof msg>>> = {
  FULL_ADMIN_ONLY: msg('Only a Full Admin can do this.'),
  ALREADY_PAID: msg('This income is already paid.'),
  NOT_PAID: msg('This income is not paid.'),
  TOO_MANY: msg('Select fewer records.'),
};

const MarkIncomeUnpaid = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    const confirmation = await openCommandConfirmationModal({
      title: t(msg('Undo paid?')),
      subtitle: t(msg('The selected incomes go back to awaiting payment.')),
      confirmButtonText: t(msg('Undo paid')),
      confirmButtonAccent: 'blue',
    });

    if (confirmation !== 'confirm') {
      return;
    }

    try {
      const { succeeded, failed } = await new RestApiClient().post<IncomeResult>('/s/incomes/unpaid', { incomeIds: recordIds });
      const descriptor = failed.length === 0 ? undefined : ERROR_MESSAGES[failed[0].code];

      await enqueueSnackbar({
        message:
          failed.length === 0
            ? t(msg('Set back to awaiting payment.'))
            : `${succeeded.length}/${recordIds.length} · ${descriptor ? t(descriptor) : failed[0].message}`,
        variant: failed.length === 0 ? 'success' : 'error',
      });
    } catch (error) {
      await showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: MARK_INCOME_UNPAID_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'mark-income-unpaid',
  description: 'Undo paid?: acts on the selected monthly incomes.',
  component: MarkIncomeUnpaid,
  isHeadless: true,
});
