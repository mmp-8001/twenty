import { FieldMetadataType, NumberDataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

type FieldSeedBase = {
  name: string;
  label: string;
  icon: string;
  isUnique?: boolean;
};

const SELECT_COLORS = [
  'gray',
  'blue',
  'sky',
  'turquoise',
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'pink',
];

export const textField = ({
  isUnique = false,
  ...field
}: FieldSeedBase): FieldMetadataSeed => ({
  ...field,
  type: FieldMetadataType.TEXT,
  isNullable: true,
  isUnique,
});

export const numberField = ({
  decimals = 0,
  ...field
}: FieldSeedBase & { decimals?: number }): FieldMetadataSeed =>
  ({
    ...field,
    type: FieldMetadataType.NUMBER,
    isNullable: true,
    settings: { dataType: NumberDataType.FLOAT, decimals, type: 'number' },
  }) as FieldMetadataSeed;

export const dateTimeField = (field: FieldSeedBase): FieldMetadataSeed => ({
  ...field,
  type: FieldMetadataType.DATE_TIME,
  isNullable: true,
});

export const booleanField = (field: FieldSeedBase): FieldMetadataSeed => ({
  ...field,
  type: FieldMetadataType.BOOLEAN,
  defaultValue: false,
});

export const phonesField = ({
  isUnique = false,
  ...field
}: FieldSeedBase): FieldMetadataSeed => ({
  ...field,
  type: FieldMetadataType.PHONES,
  isNullable: true,
  isUnique,
});

export const selectField = ({
  options,
  defaultValue,
  ...field
}: FieldSeedBase & {
  options: [value: string, label: string][];
  defaultValue?: string;
}): FieldMetadataSeed => ({
  ...field,
  type: FieldMetadataType.SELECT,
  isNullable: true,
  options: options.map(([value, label], position) => ({
    value,
    label,
    position,
    color: SELECT_COLORS[position % SELECT_COLORS.length],
  })),
  ...(defaultValue !== undefined && { defaultValue: `'${defaultValue}'` }),
});
