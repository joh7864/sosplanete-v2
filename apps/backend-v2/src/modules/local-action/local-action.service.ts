import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CategoryService } from '../category/category.service';

@Injectable()
export class LocalActionService {
  constructor(
    private prisma: PrismaService,
    private categoryService: CategoryService
  ) {}

  async create(data: { 
    instanceId: number; 
    actionRefId: number; 
    customLabel?: string; 
    categoryId?: number;
    schoolYear?: string;
  }, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    const actionRef = await this.prisma.actionRef.findUnique({ where: { id: data.actionRefId } });
    if (!actionRef) throw new Error('Action de référence non trouvée');

    return this.prisma.localAction.create({
      data: {
        instanceId: data.instanceId,
        actionRefId: data.actionRefId,
        label: data.customLabel || actionRef.referenceName,
        categoryId: data.categoryId,
        schoolYear: data.schoolYear,
      },
    });
  }

  async findAll(instanceId: number, schoolYear: string, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Accès refusé à cet espace');
    }

    const sy = schoolYear || "2024-2025";

    return this.prisma.localAction.findMany({
      where: { instanceId, schoolYear: sy },
      include: {
        actionRef: true
      }
    });
  }

  async importFromRef(instanceId: number, actionRefIds: number[], schoolYear: string, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    const actionRefs = await this.prisma.actionRef.findMany({
      where: { id: { in: actionRefIds } }
    });

    const data = actionRefs.map(ref => ({
      instanceId,
      actionRefId: ref.id,
      label: ref.referenceName,
      schoolYear,
    }));

    // On utilise createMany avec skipDuplicates car nous avons maintenant une contrainte @unique
    return this.prisma.localAction.createMany({
      data,
      skipDuplicates: true
    });
  }

  async importByCodes(instanceId: number, actions: any[], schoolYear: string, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const codes = actions.map(a => a.actionRef);
    const actionRefs = await this.prisma.actionRef.findMany({
      where: { code: { in: codes } }
    });

    // Récupération des catégories existantes pour cet espace et cette année scolaire pour le mapping
    const existingCategories = await this.prisma.category.findMany({
      where: { instanceId, schoolYear }
    });

    const results = [];
    for (const actionInput of actions) {
      const ref = actionRefs.find(r => r.code === actionInput.actionRef);
      if (!ref) continue;

      // Mapping de la catégorie par nom (normalisé)
      let categoryId = undefined;
      if (actionInput.category) {
        const normCatName = this.categoryService.normalizeString(actionInput.category);
        const match = existingCategories.find(c => this.categoryService.normalizeString(c.name) === normCatName);
        if (match) {
          categoryId = match.id;
        }
      }

      // upsert pour mettre à jour si ça existe déjà ou créer
      const local = await this.prisma.localAction.upsert({
        where: {
          instanceId_actionRefId_schoolYear: {
            instanceId,
            actionRefId: ref.id,
            schoolYear,
          }
        },
        update: {
          label: actionInput.name || ref.referenceName,
          image: actionInput.icon || null,
          description: actionInput.description || null,
          categoryId: categoryId, // Mise à jour de la catégorie si trouvée
        },
        create: {
          instanceId,
          actionRefId: ref.id,
          label: actionInput.name || ref.referenceName,
          image: actionInput.icon || null,
          description: actionInput.description || null,
          categoryId: categoryId,
          schoolYear,
        }
      });
      results.push(local);
    }
    return results;
  }

  async update(id: number, data: { label?: string, description?: string, image?: string, categoryId?: number }, user: any) {
    const localAction = await this.prisma.localAction.findUnique({
      where: { id }
    });
    if (!localAction) throw new Error('Action locale non trouvée');

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(localAction.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    return this.prisma.localAction.update({
      where: { id },
      data: {
        label: data.label,
        description: data.description,
        image: data.image,
        categoryId: data.categoryId,
      }
    });
  }

  async bulkAssignCategory(actionIds: number[], categoryId: number | null, user: any) {
    // Vérification que l'utilisateur peut accéder à toutes ces actions
    const actions = await this.prisma.localAction.findMany({
      where: { id: { in: actionIds } },
      select: { instanceId: true },
    });

    for (const action of actions) {
      const isAllowed = user.role === Role.AS || user.instanceIds?.includes(action.instanceId);
      if (!isAllowed) throw new ForbiddenException('Action non autorisée');
    }

    return this.prisma.localAction.updateMany({
      where: { id: { in: actionIds } },
      data: { categoryId },
    });
  }

  async remove(id: number, user: any) {
    const localAction = await this.prisma.localAction.findUnique({
      where: { id }
    });
    if (!localAction) throw new Error('Action locale non trouvée');

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(localAction.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    return this.prisma.localAction.delete({
      where: { id }
    });
  }
}
