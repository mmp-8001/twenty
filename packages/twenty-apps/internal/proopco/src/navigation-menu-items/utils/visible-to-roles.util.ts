// shortcut: the npm twenty-sdk lacks this fork-only field, so it is spread untyped; type it once the app builds against the fork's SDK.
export const visibleToRoles = (
  ...roleUniversalIdentifiers: string[]
): object => ({
  visibleToRoleUniversalIdentifiers: roleUniversalIdentifiers,
});
