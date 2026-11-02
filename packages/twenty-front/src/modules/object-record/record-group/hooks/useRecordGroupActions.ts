import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { RecordBoardColumnContext } from '@/object-record/record-board/record-board-column/contexts/RecordBoardColumnContext';
import { useRecordGroupVisibility } from '@/object-record/record-group/hooks/useRecordGroupVisibility';
import { useReorderRecordGroups } from '@/object-record/record-group/hooks/useReorderRecordGroups';
import { visibleRecordGroupIdsComponentFamilySelector } from '@/object-record/record-group/states/selectors/visibleRecordGroupIdsComponentFamilySelector';
import { type RecordGroupAction } from '@/object-record/record-group/types/RecordGroupActions';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordIndexIdFromCurrentContextStore } from '@/object-record/record-index/hooks/useRecordIndexIdFromCurrentContextStore';
import { recordIndexGroupFieldMetadataItemComponentState } from '@/object-record/record-index/states/recordIndexGroupFieldMetadataComponentState';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';
import { useAtomComponentFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilySelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { type ViewType } from '@/views/types/ViewType';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { isUndefined } from '@sniptt/guards';
import { useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { doNotTranslate } from 'twenty-shared/i18n';
import { getLocaleTextDirection } from 'twenty-shared/translations';
import {
  IconArrowLeft,
  IconArrowRight,
  IconEyeOff,
  IconSettings,
} from 'twenty-ui/icon';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

type UseRecordGroupActionsParams = {
  viewType: ViewType;
};

export const useRecordGroupActions = ({
  viewType,
}: UseRecordGroupActionsParams) => {
  const { recordIndexId } = useRecordIndexIdFromCurrentContextStore();
  const navigate = useNavigateSettings();
  const location = useLocation();

  const { objectNameSingular } = useRecordIndexContextOrThrow();

  const { i18n } = useLingui();
  const isRtl = getLocaleTextDirection(i18n.locale) === 'rtl';

  const { columnDefinition: recordGroupDefinition } = useContext(
    RecordBoardColumnContext,
  );

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const recordIndexGroupFieldMetadataItem = useAtomComponentStateValue(
    recordIndexGroupFieldMetadataItemComponentState,
  );

  const { handleVisibilityChange: handleRecordGroupVisibilityChange } =
    useRecordGroupVisibility();

  const setNavigationMemorizedUrl = useSetAtomState(
    navigationMemorizedUrlState,
  );

  const visibleRecordGroupIds = useAtomComponentFamilySelectorValue(
    visibleRecordGroupIdsComponentFamilySelector,
    viewType,
  );

  const { reorderRecordGroups } = useReorderRecordGroups({
    recordIndexId,
    viewType,
  });

  const navigateToSelectSettings = useCallback(() => {
    setNavigationMemorizedUrl(location.pathname + location.search);

    if (!isDefined(recordIndexGroupFieldMetadataItem)) {
      throw new Error(
        doNotTranslate('recordGroupFieldMetadata is not a non-empty string'),
      );
    }

    navigate(SettingsPath.ObjectFieldEdit, {
      objectNamePlural: objectMetadataItem.namePlural,
      fieldName: recordIndexGroupFieldMetadataItem.name,
    });
  }, [
    setNavigationMemorizedUrl,
    location.pathname,
    location.search,
    navigate,
    objectMetadataItem,
    recordIndexGroupFieldMetadataItem,
  ]);

  const hasAccessToDataModelSettings = useHasPermissionFlag(
    PermissionFlagType.DATA_MODEL,
  );
  const currentIndex = visibleRecordGroupIds.findIndex(
    (id) => id === recordGroupDefinition.id,
  );
  const isCurrentRecordGroupNotFound = currentIndex === -1;

  const recordGroupActions: RecordGroupAction[] = [
    {
      id: 'edit',
      label: t`Edit`,
      icon: IconSettings,
      position: 0,
      condition: hasAccessToDataModelSettings,
      callback: navigateToSelectSettings,
    },
    {
      id: 'moveRight',
      label: t`Move after`,
      icon: isRtl ? IconArrowLeft : IconArrowRight,
      condition:
        !isCurrentRecordGroupNotFound &&
        currentIndex < visibleRecordGroupIds.length - 1,
      position: 1,
      closeOnClick: false,
      callback: () =>
        reorderRecordGroups({
          fromIndex: currentIndex,
          toIndex: currentIndex + 1,
        }),
    },
    {
      id: 'moveLeft',
      label: t`Move before`,
      icon: isRtl ? IconArrowRight : IconArrowLeft,
      condition: !isCurrentRecordGroupNotFound && currentIndex > 0,
      position: 2,
      closeOnClick: false,
      callback: () =>
        reorderRecordGroups({
          fromIndex: currentIndex,
          toIndex: currentIndex - 1,
        }),
    },
    {
      id: 'hide',
      label: t`Hide`,
      icon: IconEyeOff,
      position: 3,
      callback: () =>
        handleRecordGroupVisibilityChange({
          ...recordGroupDefinition,
          isVisible: false,
        }),
    },
  ];

  return recordGroupActions.filter(
    ({ condition }) => isUndefined(condition) || condition !== false,
  );
};
