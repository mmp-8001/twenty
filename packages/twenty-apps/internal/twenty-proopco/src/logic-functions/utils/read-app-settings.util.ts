export type MoneySettings = {
  basis: 'paid_amount' | 'list_price';
  scope: 'first_purchase' | 'all_purchases_in_window';
  installmentRemainingEarns: boolean;
};

export class MissingSettingError extends Error {}

const requireVariable = (name: string): string => {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new MissingSettingError(`Required variable ${name} is not set`);
  }

  return value;
};

const requireDays = (name: string): number => {
  const days = Number(requireVariable(name));

  if (!Number.isFinite(days) || days < 0) {
    throw new MissingSettingError(`Variable ${name} must be a number of days`);
  }

  return days;
};

export const readRetryWindowDays = (): number =>
  requireDays('RETRY_WINDOW_DAYS');

export const readPoolDays = (): number => requireDays('POOL_DAYS');

export const readMoneySettings = (): MoneySettings => {
  const basis = requireVariable('COMMISSION_BASIS');
  const scope = requireVariable('COMMISSION_SCOPE');
  const installmentRemainingEarns = requireVariable(
    'INSTALLMENT_REMAINING_EARNS',
  );

  if (basis !== 'paid_amount' && basis !== 'list_price') {
    throw new MissingSettingError(`COMMISSION_BASIS "${basis}" is not valid`);
  }

  if (scope !== 'first_purchase' && scope !== 'all_purchases_in_window') {
    throw new MissingSettingError(`COMMISSION_SCOPE "${scope}" is not valid`);
  }

  return {
    basis,
    scope,
    installmentRemainingEarns: installmentRemainingEarns === 'true',
  };
};
