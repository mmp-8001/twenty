import { type MetadataApiClient } from 'twenty-client-sdk/metadata';
import { isDefined } from 'twenty-sdk/utils';

import * as universalIdentifiers from 'src/constants/universal-identifiers';
import {
  FOLDER_NAMES,
  type SidebarFolder,
} from 'src/logic-functions/utils/sidebar/sidebar-spec.util';

type PersonalItem = {
  id: string;
  type: string;
  name: string | null;
  folderId: string | null;
  position: number;
  viewId: string | null;
  pageLayoutId: string | null;
};

type SidebarClient = Pick<MetadataApiClient, 'query' | 'mutation'>;

const APP_FOLDER_NAMES: string[] = Object.values(FOLDER_NAMES).flatMap(({ fa, en }) => [fa, en]);

const APP_TARGET_IDENTIFIERS = new Set<string>(
  Object.entries(universalIdentifiers)
    .filter(([key]) => /_(VIEW|PAGE_LAYOUT)_UNIVERSAL_IDENTIFIER$/.test(key))
    .map(([, value]) => value),
);

const byPosition = (left: PersonalItem, right: PersonalItem) => left.position - right.position;

const resolveTargetIds = async (metadata: SidebarClient) => {
  const { getViews, getPageLayouts } = await metadata.query({
    getViews: { id: true, universalIdentifier: true },
    getPageLayouts: { id: true, universalIdentifier: true },
  });

  return new Map(
    [...getViews, ...getPageLayouts]
      .filter(({ universalIdentifier }) => APP_TARGET_IDENTIFIERS.has(universalIdentifier))
      .map(({ id, universalIdentifier }) => [universalIdentifier, id] as const),
  );
};

// Folders and items in order: [folderName, ...childTargetIds]
const structureOfCurrent = (appTargetIds: Set<string>, personalItems: PersonalItem[]) => {
  const appItems = personalItems.filter(
    ({ viewId, pageLayoutId }) => appTargetIds.has(viewId ?? pageLayoutId ?? ''),
  );
  const folders = personalItems
    .filter(({ type, name }) => type === 'FOLDER' && APP_FOLDER_NAMES.includes(name ?? ''))
    .sort(byPosition);

  return {
    appItems,
    folders,
    structure: folders.map((folder) => [
      folder.name,
      ...appItems
        .filter(({ folderId }) => folderId === folder.id)
        .sort(byPosition)
        .map(({ viewId, pageLayoutId }) => viewId ?? pageLayoutId),
    ]),
  };
};

export const syncSidebar = async ({
  metadata,
  applicationMetadata,
  spec,
  userWorkspaceId,
  force,
}: {
  metadata: SidebarClient;
  applicationMetadata: SidebarClient;
  spec: SidebarFolder[];
  userWorkspaceId: string;
  force: boolean;
}): Promise<{ changed: boolean }> => {
  const targetIds = await resolveTargetIds(applicationMetadata);
  const { navigationMenuItems } = await metadata.query({
    navigationMenuItems: {
      id: true,
      type: true,
      name: true,
      folderId: true,
      position: true,
      viewId: true,
      pageLayoutId: true,
      userWorkspaceId: true,
    },
  });
  const personalItems = navigationMenuItems.filter((item) => isDefined(item.userWorkspaceId)) as PersonalItem[];
  const { appItems, folders, structure } = structureOfCurrent(new Set(targetIds.values()), personalItems);
  const desiredFolders = spec.map((folder) => ({
    ...folder,
    targetIds: folder.targets
      .map(({ universalIdentifier }) => targetIds.get(universalIdentifier))
      .filter(isDefined),
  }));
  const desiredStructure = desiredFolders.map(({ name, targetIds: ids }) => [name, ...ids]);

  if (!force && JSON.stringify(structure) === JSON.stringify(desiredStructure)) {
    return { changed: false };
  }

  // Items first so a folder delete never cascades into rows already gone.
  const staleIds = [...appItems, ...folders].map(({ id }) => id);

  if (staleIds.length > 0) {
    await metadata.mutation({ deleteManyNavigationMenuItems: { __args: { ids: staleIds }, id: true } });
  }

  for (const [folderIndex, folder] of desiredFolders.entries()) {
    const { createNavigationMenuItem } = await metadata.mutation({
      createNavigationMenuItem: {
        __args: {
          input: {
            type: 'FOLDER',
            name: folder.name,
            icon: folder.icon,
            position: folderIndex,
            userWorkspaceId,
          },
        },
        id: true,
      },
    });

    if (folder.targets.length === 0) {
      continue;
    }

    await metadata.mutation({
      createManyNavigationMenuItems: {
        __args: {
          inputs: folder.targets.flatMap(({ kind, universalIdentifier }, index) => {
            const id = targetIds.get(universalIdentifier);

            return isDefined(id)
              ? [
                  {
                    type: kind,
                    ...(kind === 'VIEW' ? { viewId: id } : { pageLayoutId: id }),
                    folderId: createNavigationMenuItem.id,
                    position: index,
                    userWorkspaceId,
                  },
                ]
              : [];
          }),
        },
        id: true,
      },
    });
  }

  return { changed: true };
};
