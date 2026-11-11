export const READ_ONLY_GRANT = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

export const READ_WRITE_GRANT = {
  ...READ_ONLY_GRANT,
  canUpdateObjectRecords: true,
};

export const READ_WRITE_SOFT_DELETE_GRANT = {
  ...READ_WRITE_GRANT,
  canSoftDeleteObjectRecords: true,
};

export const NO_ACCESS_GRANT = {
  canReadObjectRecords: false,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

// Only the app writes these; humans see them.
export const readOnlyField = (
  objectUniversalIdentifier: string,
  fieldUniversalIdentifier: string,
) => ({
  objectUniversalIdentifier,
  fieldUniversalIdentifier,
  canReadFieldValue: true,
  canUpdateFieldValue: false,
});

// Commission is read by Full Admin only; agents see their payout through Monthly income.
export const hiddenField = (
  objectUniversalIdentifier: string,
  fieldUniversalIdentifier: string,
) => ({
  objectUniversalIdentifier,
  fieldUniversalIdentifier,
  canReadFieldValue: false,
  canUpdateFieldValue: false,
});
