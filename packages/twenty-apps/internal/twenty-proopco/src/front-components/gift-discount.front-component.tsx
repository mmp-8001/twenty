import { useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  closeSidePanel,
  enqueueSnackbar,
  unmountFrontComponent,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { GIFT_DISCOUNT_ROUTE_PATH } from 'src/constants/campaign.constant';
import { GIFT_DISCOUNT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

type GiftResponse = { success: boolean; error?: string };

const GiftDiscountForm = () => {
  const [personId] = useSelectedRecordIds();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);

    try {
      const result = await new RestApiClient().post<GiftResponse>(
        `/s${GIFT_DISCOUNT_ROUTE_PATH}`,
        { personId, code },
      );

      // Proopco's own message is shown as it came.
      await enqueueSnackbar(
        result.success
          ? { message: 'Discount code applied', variant: 'success' }
          : { message: result.error ?? 'Gift failed', variant: 'error' },
      );

      if (result.success) {
        unmountFrontComponent();
        closeSidePanel();
      }
    } catch {
      await enqueueSnackbar({ message: 'Gift failed', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
      <label htmlFor="gift-code">Existing proopco discount code</label>
      <input
        id="gift-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
      <button
        type="button"
        onClick={submit}
        disabled={isSubmitting || code.trim() === ''}
      >
        {isSubmitting ? 'Applying…' : 'Gift code'}
      </button>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: GIFT_DISCOUNT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'gift-discount-form',
  description: 'Asks for a proopco discount code and gifts it to the Trader.',
  component: GiftDiscountForm,
});
