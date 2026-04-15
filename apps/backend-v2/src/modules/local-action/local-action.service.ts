import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class LocalActionService {
  constructor(private prisma: PrismaService) {}

  async create(data: { 
    instanceId: number; 
    actionRefId: number; 
    customLabel?: string; 
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
      },
    });
  }

  async findAll(instanceId: number, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Accès refusé à cet espace');
    }

    return this.prisma.localAction.findMany({
      where: { instanceId },
      include: {
        actionRef: true
      }
    });
  }

  async importFromRef(instanceId: number, actionRefIds: number[], user: any) {
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
    }));

    // On utilise createMany avec skipDuplicates car nous avons maintenant une contrainte @unique
    return this.prisma.localAction.createMany({
      data,
      skipDuplicates: true
    });
  }

  async importByCodes(instanceId: number, actions: any[], user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const codes = actions.map(a => a.actionRef);
    const actionRefs = await this.prisma.actionRef.findMany({
      where: { code: { in: codes } }
    });

    const results = [];
    for (const actionInput of actions) {
      const ref = actionRefs.find(r => r.code === actionInput.actionRef);
      if (!ref) continue;

      // upsert pour mettre à jour si ça existe déjà ou créer
      const local = await this.prisma.localAction.upsert({
        where: {
          instanceId_actionRefId: {
            instanceId,
            actionRefId: ref.id
          }
        },
        update: {
          label: actionInput.name || ref.referenceName,
          image: actionInput.icon || null,
          description: actionInput.description || null,
        },
        create: {
          instanceId,
          actionRefId: ref.id,
          label: actionInput.name || ref.referenceName,
          image: actionInput.icon || null,
          description: actionInput.description || null,
        }
      });
      results.push(local);
    }
    return results;
  }

  async update(id: number, data: { label?: string, description?: string, image?: string }, user: any) {
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
        image: data.image
      }
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
