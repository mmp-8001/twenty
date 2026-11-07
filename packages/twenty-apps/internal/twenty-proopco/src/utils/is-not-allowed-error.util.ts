// The routes answer role refusals with this English text; the hint is only shown for it.
export const isNotAllowedError = (error: string | undefined) => error === 'You are not allowed to do this';
