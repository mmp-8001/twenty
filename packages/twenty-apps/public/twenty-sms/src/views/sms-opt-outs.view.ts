import { defineView, ViewType } from 'twenty-sdk/define';

import {
  OPT_OUT_OBJECT_UNIVERSAL_IDENTIFIER,
  OPT_OUTS_VIEW_UNIVERSAL_IDENTIFIER,
  OPT_PHONE_UNIVERSAL_IDENTIFIER,
  OPT_REASON_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: OPT_OUTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'SMS Opt-outs',
  objectUniversalIdentifier: OPT_OUT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconMessageOff',
  position: 0,
  fields: [
    {
      universalIdentifier: '101f6578-adfc-49f7-b5b2-df338dfd494d',
      fieldMetadataUniversalIdentifier: OPT_PHONE_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '0f2e0ee8-6afb-49d3-a582-bec76d86e8af',
      fieldMetadataUniversalIdentifier: OPT_REASON_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
  ],
});
