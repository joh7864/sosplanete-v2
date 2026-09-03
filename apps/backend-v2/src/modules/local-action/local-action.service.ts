import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CategoryService } from '../category/category.service';

@Injectable()
export class LocalActionService {
  constructor(
    private prisma: PrismaService,
    private categoryService: CategoryService,
  ) {}

  async create(
    data: {
      instanceId: number;
      actionRefId: number;
      customLabel?: string;
      categoryId?: number;
      schoolYear?: string;
    },
    user: any,
  ) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    const actionRef = await this.prisma.actionRef.findUnique({
      where: { id: data.actionRefId },
    });
    if (!actionRef)
      throw new NotFoundException('Action de référence non trouvée');

    return this.prisma.localAction.create({
      data: {
        instanceId: data.instanceId,
        actionRefId: data.actionRefId,
        label: data.customLabel || actionRef.referenceName,
        description: actionRef.description,
        categoryId: data.categoryId,
        schoolYear: data.schoolYear,
      },
      include: {
        actionRef: true,
        evoeMission: true,
      },
    });
  }

  async findAll(instanceId: number, schoolYear: string, user: any) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Accès refusé à cet espace');
    }

    const sy = schoolYear || '2024-2025';

    return this.prisma.localAction.findMany({
      where: { instanceId, schoolYear: sy },
      include: {
        actionRef: true,
        evoeMission: true,
        _count: {
          select: { actionsDone: true },
        },
      },
    });
  }

  async importFromRef(
    instanceId: number,
    actionRefIds: number[],
    schoolYear: string,
    user: any,
  ) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    const actionRefs = await this.prisma.actionRef.findMany({
      where: { id: { in: actionRefIds } },
    });

    const data = actionRefs.map((ref) => ({
      instanceId,
      actionRefId: ref.id,
      label: ref.referenceName,
      description: ref.description,
      schoolYear,
    }));

    // On utilise createMany avec skipDuplicates car nous avons maintenant une contrainte @unique
    return this.prisma.localAction.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async importByCodes(
    instanceId: number,
    actions: any[],
    schoolYear: string,
    user: any,
  ) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    const results = [];
    for (const actionInput of actions) {
      const code = actionInput.code || actionInput.actionRef;
      if (!code) continue;

      const ref = await this.prisma.actionRef.findUnique({
        where: { code: code.trim() },
      });
      if (!ref) continue;

      let categoryId: number | null = null;
      if (actionInput.category) {
        try {
          const instanceYearId =
            await this.categoryService.resolveInstanceYearId(
              instanceId,
              schoolYear,
            );
          let cat = await this.prisma.category.findFirst({
            where: {
              instanceYearId,
              name: {
                equals: actionInput.category.trim(),
                mode: 'insensitive',
              },
            },
          });
          if (!cat) {
            cat = await this.prisma.category.create({
              data: {
                name: actionInput.category.trim(),
                instanceYearId,
                order: 0,
              },
            });
          }
          categoryId = cat.id;
        } catch (e) {}
      }

      const local = await this.prisma.localAction.upsert({
        where: {
          instanceId_actionRefId_schoolYear: {
            instanceId,
            actionRefId: ref.id,
            schoolYear,
          },
        },
        update: {
          label: actionInput.name || ref.referenceName,
          image: actionInput.icon || null,
          description: actionInput.description || ref.description || null,
          categoryId: categoryId,
        },
        create: {
          instanceId,
          actionRefId: ref.id,
          label: actionInput.name || ref.referenceName,
          image: actionInput.icon || null,
          description: actionInput.description || ref.description || null,
          categoryId: categoryId,
          schoolYear,
        },
        include: {
          actionRef: true,
          evoeMission: true,
        },
      });
      results.push(local);
    }
    return results;
  }

  async update(
    id: number,
    data: {
      label?: string;
      description?: string;
      image?: string;
      imageEvoe?: string;
      categoryId?: number | null;
      specificCo2?: number | null;
      specificWater?: number | null;
      specificWaste?: number | null;
      specificEnergy?: number | null;
      titreSF?: string;
      descriptionSF?: string;
      pointsIT?: number;
      pointsGagnes?: number;
    },
    user: any,
  ) {
    const localAction = await this.prisma.localAction.findUnique({
      where: { id },
      include: { evoeMission: true },
    });
    if (!localAction) throw new NotFoundException('Action locale non trouvée');

    const isAllowed =
      user.role === Role.AS ||
      user.instanceIds?.includes(localAction.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    // 1. Update LocalAction
    const updated = await this.prisma.localAction.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.imageEvoe !== undefined && { imageEvoe: data.imageEvoe }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.specificCo2 !== undefined && {
          specificCo2: data.specificCo2,
        }),
        ...(data.specificWater !== undefined && {
          specificWater: data.specificWater,
        }),
        ...(data.specificWaste !== undefined && {
          specificWaste: data.specificWaste,
        }),
        ...(data.specificEnergy !== undefined && {
          specificEnergy: data.specificEnergy,
        }),
      },
    });

    // 2. Handle EvoeMissionTranslation update/upsert if SF fields provided
    const itPoints =
      data.pointsIT !== undefined ? data.pointsIT : data.pointsGagnes;
    if (
      data.titreSF !== undefined ||
      data.descriptionSF !== undefined ||
      itPoints !== undefined
    ) {
      await this.prisma.evoeMissionTranslation.upsert({
        where: { localActionId: id },
        update: {
          ...(data.titreSF !== undefined && { titreSF: data.titreSF }),
          ...(data.descriptionSF !== undefined && {
            descriptionSF: data.descriptionSF,
          }),
          ...(itPoints !== undefined && { pointsGagnes: itPoints }),
        },
        create: {
          localActionId: id,
          titreSF: data.titreSF || `Mission : ${updated.label}`,
          descriptionSF: data.descriptionSF || updated.description || '',
          pointsGagnes: itPoints || 10,
        },
      });
    }

    return this.prisma.localAction.findUnique({
      where: { id },
      include: {
        actionRef: true,
        evoeMission: true,
      },
    });
  }

  async bulkAssignCategory(
    actionIds: number[],
    categoryId: number | null,
    user: any,
  ) {
    const actions = await this.prisma.localAction.findMany({
      where: { id: { in: actionIds } },
      select: { instanceId: true },
    });

    for (const action of actions) {
      const isAllowed =
        user.role === Role.AS || user.instanceIds?.includes(action.instanceId);
      if (!isAllowed) throw new ForbiddenException('Action non autorisée');
    }

    return this.prisma.localAction.updateMany({
      where: { id: { in: actionIds } },
      data: { categoryId },
    });
  }

  async remove(id: number, user: any) {
    const localAction = await this.prisma.localAction.findUnique({
      where: { id },
    });
    if (!localAction) throw new NotFoundException('Action locale non trouvée');

    const isAllowed =
      user.role === Role.AS ||
      user.instanceIds?.includes(localAction.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    return this.prisma.localAction.delete({
      where: { id },
    });
  }
}
