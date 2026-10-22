import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { CalendarStartDay } from 'twenty-shared/constants';
import {
  FieldMetadataType,
  RelationType,
  RowLevelPermissionPredicateOperand,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { FieldPermissionService } from 'src/engine/metadata-modules/object-permission/field-permission/field-permission.service';
import { ObjectPermissionService } from 'src/engine/metadata-modules/object-permission/object-permission.service';
import { RoleService } from 'src/engine/metadata-modules/role/role.service';
import { RowLevelPermissionPredicateService } from 'src/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { BRAND_SEED_CONFIGS } from 'src/engine/workspace-manager/dev-seeder/brands/constants/brand-seed-configs.constant';
import { type BrandWorkspaceId } from 'src/engine/workspace-manager/dev-seeder/brands/constants/brand-workspace-ids.constant';
import {
  CORE_FIELD_SEEDS,
  CORE_OBJECT_SEEDS,
  CORE_RELATION_SEEDS,
} from 'src/engine/workspace-manager/dev-seeder/brands/shared/constants/core-model-seeds.constant';
import {
  type BrandRole,
  type BrandSeedConfig,
} from 'src/engine/workspace-manager/dev-seeder/brands/types/brand-seed-config.type';
import { DevSeederPermissionsService } from 'src/engine/workspace-manager/dev-seeder/core/services/dev-seeder-permissions.service';

const BRAND_ROLE_INPUTS: Record<
  BrandRole,
  {
    label: string;
    description: string;
    icon: string;
    canUpdateAllSettings: boolean;
    canSoftDeleteAllObjectRecords: boolean;
  }
> = {
  MANAGER: {
    label: 'مدیر',
    description: 'همه رکوردها، واگذاری سرنخ و تأیید کمیسیون',
    icon: 'IconUserStar',
    canUpdateAllSettings: true,
    canSoftDeleteAllObjectRecords: true,
  },
  SALES: {
    label: 'فروش',
    description: 'فقط سرنخ‌ها و کمیسیون‌های خودش',
    icon: 'IconTargetArrow',
    canUpdateAllSettings: false,
    canSoftDeleteAllObjectRecords: false,
  },
  SUPPORT: {
    label: 'پشتیبانی',
    description: 'مشاهده مشتریان، یادداشت و وظیفه، بدون سرنخ و کمیسیون',
    icon: 'IconHeadset',
    canUpdateAllSettings: false,
    canSoftDeleteAllObjectRecords: false,
  },
};

// Snapshots taken when the commission is created; only status and void
// reason change afterwards.
const COMMISSION_SNAPSHOT_FIELD_NAMES = [
  'amount',
  'employee',
  'lead',
  'earnedAt',
  'earnedJalaliMonth',
  'isPartnershipRate',
  'firstPurchaseAmount',
];

@Injectable()
export class DevSeederBrandService {
  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly roleService: RoleService,
    private readonly userRoleService: UserRoleService,
    private readonly objectPermissionService: ObjectPermissionService,
    private readonly fieldPermissionService: FieldPermissionService,
    private readonly rowLevelPermissionPredicateService: RowLevelPermissionPredicateService,
    private readonly devSeederPermissionsService: DevSeederPermissionsService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  public async seed({
    workspaceId,
    schemaName,
    workspaceCustomFlatApplication,
  }: {
    workspaceId: BrandWorkspaceId;
    schemaName: string;
    workspaceCustomFlatApplication: FlatApplication;
  }) {
    const config = BRAND_SEED_CONFIGS[workspaceId];

    await this.seedMetadata(workspaceId, config);
    await this.seedRoles({
      workspaceId,
      config,
      workspaceCustomFlatApplication,
    });
    await this.seedWorkspaceMembers(schemaName, config);
  }

  // Company and Opportunity are referenced by standard seed steps, so they
  // are switched off only once everything else is in place.
  public async deactivateUnusedStandardObjects(workspaceId: string) {
    const objects = await this.findObjectsWithFields(workspaceId);

    for (const objectName of ['company', 'opportunity']) {
      await this.objectMetadataService.updateOneObject({
        workspaceId,
        updateObjectInput: {
          id: this.getObject(objects, objectName).id,
          update: { isActive: false },
        },
      });
    }
  }

  private async seedMetadata(workspaceId: string, config: BrandSeedConfig) {
    const objectSeeds = [...CORE_OBJECT_SEEDS, ...config.objects];
    const relationSeeds = [...CORE_RELATION_SEEDS, ...config.relations];

    for (const objectSeed of objectSeeds) {
      await this.objectMetadataService.createOneObject({
        createObjectInput: objectSeed,
        workspaceId,
      });
    }

    let objects = await this.findObjectsWithFields(workspaceId);

    for (const { objectName, seeds } of [
      ...CORE_FIELD_SEEDS,
      ...config.fields,
    ]) {
      const objectMetadataId = this.getObject(objects, objectName).id;

      await this.fieldMetadataService.createManyFields({
        workspaceId,
        createFieldInputs: seeds.map((seed) => ({
          ...seed,
          objectMetadataId,
        })),
      });
    }

    for (const relation of relationSeeds) {
      await this.fieldMetadataService.createManyFields({
        workspaceId,
        createFieldInputs: [
          {
            type: FieldMetadataType.RELATION,
            name: relation.name,
            label: relation.label,
            icon: relation.icon,
            objectMetadataId: this.getObject(objects, relation.objectName).id,
            relationCreationPayload: {
              type: RelationType.MANY_TO_ONE,
              targetObjectMetadataId: this.getObject(
                objects,
                relation.targetObjectName,
              ).id,
              targetFieldLabel: relation.inverseName.replace(/([A-Z])/g, ' $1'),
              targetFieldIcon: relation.inverseIcon,
            },
          },
        ],
      });
    }

    objects = await this.findObjectsWithFields(workspaceId);

    const persianLabelUpdates = [
      ...relationSeeds.map((relation) => ({
        id: this.getFieldId(
          objects,
          relation.targetObjectName,
          relation.inverseName,
        ),
        label: relation.inverseLabel,
      })),
      ...objectSeeds.map((objectSeed) => ({
        id: this.getFieldId(objects, objectSeed.nameSingular, 'name'),
        label: 'نام',
      })),
    ];

    for (const updateFieldInput of persianLabelUpdates) {
      await this.fieldMetadataService.updateOneField({
        workspaceId,
        updateFieldInput,
      });
    }

    // One customer per mobile number per brand.
    await this.fieldMetadataService.updateOneField({
      workspaceId,
      updateFieldInput: {
        id: this.getFieldId(objects, 'person', 'phones'),
        isUnique: true,
      },
    });

    await this.objectMetadataService.updateOneObject({
      workspaceId,
      updateObjectInput: {
        id: this.getObject(objects, 'person').id,
        update: { labelSingular: 'مشتری', labelPlural: 'مشتریان' },
      },
    });
  }

  private async seedRoles({
    workspaceId,
    config,
    workspaceCustomFlatApplication,
  }: {
    workspaceId: string;
    config: BrandSeedConfig;
    workspaceCustomFlatApplication: FlatApplication;
  }) {
    const objects = await this.findObjectsWithFields(workspaceId);
    const objectId = (objectName: string) =>
      this.getObject(objects, objectName).id;
    const fieldPermission = (
      objectName: string,
      fieldName: string,
      canReadFieldValue: boolean | null = null,
    ) => ({
      objectMetadataId: objectId(objectName),
      fieldMetadataId: this.getFieldId(objects, objectName, fieldName),
      canReadFieldValue,
      canUpdateFieldValue: false,
    });

    const roleIds = {} as Record<BrandRole, string>;

    for (const [brandRole, roleInput] of Object.entries(BRAND_ROLE_INPUTS)) {
      const role = await this.roleService.createRole({
        workspaceId,
        ownerFlatApplication: workspaceCustomFlatApplication,
        input: {
          ...roleInput,
          canAccessAllTools: true,
          canReadAllObjectRecords: true,
          canUpdateAllObjectRecords: true,
          canDestroyAllObjectRecords: false,
        },
      });

      roleIds[brandRole as BrandRole] = role.id;
    }

    await this.fieldPermissionService.upsertFieldPermissions({
      workspaceId,
      input: {
        roleId: roleIds.MANAGER,
        fieldPermissions: COMMISSION_SNAPSHOT_FIELD_NAMES.map((fieldName) =>
          fieldPermission('commission', fieldName),
        ),
      },
    });

    await this.objectPermissionService.upsertObjectPermissions({
      workspaceId,
      input: {
        roleId: roleIds.SALES,
        objectPermissions: [
          {
            objectMetadataId: objectId('commission'),
            canReadObjectRecords: true,
            canUpdateObjectRecords: false,
            canSoftDeleteObjectRecords: false,
            canDestroyObjectRecords: false,
          },
        ],
      },
    });

    // Only managers reassign leads and customers.
    await this.fieldPermissionService.upsertFieldPermissions({
      workspaceId,
      input: {
        roleId: roleIds.SALES,
        fieldPermissions: [
          fieldPermission('lead', 'assignee'),
          fieldPermission('person', 'accountManager'),
        ],
      },
    });

    const workspaceMemberIdFieldId = this.getFieldId(
      objects,
      'workspaceMember',
      'id',
    );

    for (const [objectName, memberFieldName] of [
      ['lead', 'assignee'],
      ['commission', 'employee'],
    ]) {
      await this.rowLevelPermissionPredicateService.upsertRowLevelPermissionPredicates(
        {
          workspaceId,
          input: {
            roleId: roleIds.SALES,
            objectMetadataId: objectId(objectName),
            predicates: [
              {
                fieldMetadataId: this.getFieldId(
                  objects,
                  objectName,
                  memberFieldName,
                ),
                operand: RowLevelPermissionPredicateOperand.IS,
                workspaceMemberFieldMetadataId: workspaceMemberIdFieldId,
              },
            ],
            predicateGroups: [],
          },
        },
      );
    }

    await this.objectPermissionService.upsertObjectPermissions({
      workspaceId,
      input: {
        roleId: roleIds.SUPPORT,
        objectPermissions: [
          ...['lead', 'commission'].map((objectName) => ({
            objectMetadataId: objectId(objectName),
            canReadObjectRecords: false,
            canUpdateObjectRecords: false,
            canSoftDeleteObjectRecords: false,
            canDestroyObjectRecords: false,
          })),
          {
            objectMetadataId: objectId('person'),
            canReadObjectRecords: true,
            canUpdateObjectRecords: false,
            canSoftDeleteObjectRecords: false,
            canDestroyObjectRecords: false,
          },
        ],
      },
    });

    for (const [brandRole, roleId] of Object.entries(roleIds)) {
      await this.userRoleService.assignRoleToManyUserWorkspace({
        workspaceId,
        roleId,
        userWorkspaceIds: config.members
          .filter((member) => member.role === brandRole)
          .map((member) => member.userWorkspaceId),
      });
    }

    await this.devSeederPermissionsService.initMinimalPermissionsAndActivateWorkspace(
      { workspaceId, workspaceCustomFlatApplication },
    );
  }

  private async seedWorkspaceMembers(
    schemaName: string,
    config: BrandSeedConfig,
  ) {
    await this.coreDataSource
      .createQueryBuilder()
      .insert()
      .into(`${schemaName}.workspaceMember`, [
        'id',
        'nameFirstName',
        'nameLastName',
        'locale',
        'colorScheme',
        'calendarStartDay',
        'timeZone',
        'userEmail',
        'userId',
      ])
      .orIgnore()
      .values(
        config.members.map((member) => ({
          id: member.workspaceMemberId,
          nameFirstName: member.firstName,
          nameLastName: member.lastName,
          locale: 'fa',
          colorScheme: 'System',
          calendarStartDay: CalendarStartDay.SATURDAY,
          timeZone: 'Asia/Tehran',
          userEmail: member.email,
          userId: member.userId,
        })),
      )
      .execute();
  }

  private async findObjectsWithFields(
    workspaceId: string,
  ): Promise<ObjectMetadataEntity[]> {
    return this.coreDataSource.getRepository(ObjectMetadataEntity).find({
      where: { workspaceId },
      relations: { fields: true },
    });
  }

  private getObject(
    objects: ObjectMetadataEntity[],
    objectName: string,
  ): ObjectMetadataEntity {
    const object = objects.find(
      (objectMetadata) => objectMetadata.nameSingular === objectName,
    );

    if (!isDefined(object)) {
      throw new Error(`Brand seed: object not found: ${objectName}`);
    }

    return object;
  }

  private getFieldId(
    objects: ObjectMetadataEntity[],
    objectName: string,
    fieldName: string,
  ): string {
    const field = this.getObject(objects, objectName).fields.find(
      (fieldMetadata) => fieldMetadata.name === fieldName,
    );

    if (!isDefined(field)) {
      throw new Error(
        `Brand seed: field not found: ${objectName}.${fieldName}`,
      );
    }

    return field.id;
  }
}
