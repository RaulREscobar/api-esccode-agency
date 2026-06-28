import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectResourceFieldDto } from './dto/create-project-resource-field.dto';
import { UpdateProjectResourceFieldDto } from './dto/update-project-resource-field.dto';

@Injectable()
export class ProjectResourcesService {
  constructor(private prisma: PrismaService) {}

  async getResources(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.projectFieldValue.findMany({
      where: { projectId },
      include: { fieldDefinition: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createField(projectId: string, dto: CreateProjectResourceFieldDto) {
    await this.ensureProject(projectId);
    const definition = dto.fieldDefinitionId
      ? await this.prisma.projectFieldDefinition.findUnique({ where: { id: dto.fieldDefinitionId } })
      : await this.prisma.projectFieldDefinition.create({
          data: {
            key: dto.key!,
            label: dto.label!,
            type: dto.type!,
            isSensitive: dto.isSensitive,
            isActive: true,
          },
        });
    if (!definition) {
      throw new NotFoundException('Definición de campo no encontrada');
    }
    return this.prisma.projectFieldValue.create({
      data: {
        projectId,
        fieldDefinitionId: definition.id,
        valuePlain: dto.isSensitive ? null : dto.value,
        valueEncrypted: dto.isSensitive ? dto.value : null,
        displayOrder: dto.displayOrder ?? 0,
      },
      include: { fieldDefinition: true },
    });
  }

  async updateField(projectId: string, fieldId: string, dto: UpdateProjectResourceFieldDto) {
    await this.ensureProject(projectId);
    const existing = await this.prisma.projectFieldValue.findFirst({
      where: { id: fieldId, projectId },
      include: { fieldDefinition: true },
    });
    if (!existing) {
      throw new NotFoundException('Campo de recurso no encontrado para este proyecto');
    }

    const isSensitive = dto.isSensitive ?? existing.fieldDefinition.isSensitive;
    return this.prisma.projectFieldValue.update({
      where: { id: fieldId },
      data: {
        valuePlain: isSensitive ? null : dto.value,
        valueEncrypted: isSensitive ? dto.value : null,
        displayOrder: dto.displayOrder,
      },
      include: { fieldDefinition: true },
    });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }
}
