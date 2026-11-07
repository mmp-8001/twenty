export type CommissionKind = 'CAMPAIGN_SUCCESS' | 'REBUY_SUCCESS' | 'RETENTION';

export type PurchaseDecision =
  | { type: 'NOTHING' }
  | { type: 'PURCHASE_BEFORE_CALL' }
  | { type: 'SUCCESS'; commissionKind: CommissionKind }
  | { type: 'RETENTION'; commissionKind: 'RETENTION' };

// FUP-04, FUP-08, RB-06: what a purchase does, by the User's open Ownership state.
export const decidePurchase = ({
  ownershipState,
  followupKind,
}: {
  ownershipState: string | null;
  followupKind: string | null;
}): PurchaseDecision => {
  switch (ownershipState) {
    case 'PENDING_FIRST_CALL':
      return { type: 'PURCHASE_BEFORE_CALL' };
    case 'IN_FOLLOWUP':
      return {
        type: 'SUCCESS',
        commissionKind: followupKind === 'REBUY' ? 'REBUY_SUCCESS' : 'CAMPAIGN_SUCCESS',
      };
    case 'REBUY_PENDING':
      return { type: 'SUCCESS', commissionKind: 'REBUY_SUCCESS' };
    case 'SUCCESSFUL':
      return { type: 'RETENTION', commissionKind: 'RETENTION' };
    default:
      return { type: 'NOTHING' };
  }
};
