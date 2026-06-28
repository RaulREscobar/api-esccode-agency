import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PatchProjectStatusDto } from './dto/patch-project-status.dto';
import { FilesService } from '../files/files.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private auditLogsService: AuditLogsService,
  ) {}

  private readonly publicUserSelect = {
    id: true,
    email: true,
    role: true,
    isActive: true,
    assignedProjectId: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll() {
    return this.prisma.project.findMany({
      include: { workType: true, createdBy: { select: this.publicUserSelect } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        workType: true,
        createdBy: { select: this.publicUserSelect },
        tasks: true,
        quotes: true,
        fieldValues: { include: { fieldDefinition: true } },
        driveFolders: true,
        statusHistory: { include: { changedBy: { select: this.publicUserSelect } } },
      },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const workType = await this.prisma.workType.findUnique({ where: { id: dto.workTypeId } });
    if (!workType) {
      throw new BadRequestException('Tipo de trabajo inválido');
    }
    if (dto.status === ProjectStatus.INICIO && !dto.estimatedDeliveryDate) {
      throw new BadRequestException('La fecha estimada de finalización es obligatoria en estado INICIO');
    }

    const created = await this.prisma.project.create({
      data: {
        name: dto.name,
        status: dto.status,
        startDate: this.toDate(dto.startDate),
        estimatedDeliveryDate: this.toDate(dto.estimatedDeliveryDate),
        workTypeId: dto.workTypeId,
        clientDisplayName: dto.clientDisplayName,
        quoteStatus: dto.quoteStatus,
        priority: dto.priority,
        comments: dto.comments,
        createdById: userId,
      },
    });

    const localData = await this.filesService.createProjectStructure(created.id);

    await this.prisma.driveFolder.create({
      data: {
        projectId: created.id,
        name: localData.root.name,
        folderType: 'root',
        driveFolderId: localData.root.driveFolderId,
        driveUrl: localData.root.driveUrl,
      },
    });

    await Promise.all(
      localData.children.map((child) =>
        this.prisma.driveFolder.create({
          data: {
            projectId: created.id,
            name: child.name,
            folderType: child.name,
            driveFolderId: child.driveFolderId,
            driveUrl: child.driveUrl,
            parentDriveFolderId: localData.root.driveFolderId,
          },
        }),
      ),
    );

    await this.auditLogsService.create({
      actorUserId: userId,
      action: 'CREATE_PROJECT',
      entityType: 'Project',
      entityId: created.id,
      metadata: { name: created.name, workTypeId: dto.workTypeId },
    });

    return this.prisma.project.findUnique({
      where: { id: created.id },
      include: { workType: true, createdBy: { select: this.publicUserSelect } }
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findOne(id);
    if (project.status === ProjectStatus.FINALIZADA) {
      throw new BadRequestException('No se puede editar un proyecto finalizado');
    }

    if (dto.status === ProjectStatus.INICIO && !dto.estimatedDeliveryDate) {
      throw new BadRequestException('La fecha estimada de finalización es obligatoria en estado INICIO');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        startDate: this.toDate(dto.startDate),
        estimatedDeliveryDate: this.toDate(dto.estimatedDeliveryDate),
        workTypeId: dto.workTypeId,
        clientDisplayName: dto.clientDisplayName,
        quoteStatus: dto.quoteStatus,
        priority: dto.priority,
        comments: dto.comments,
      },
      include: { workType: true, createdBy: { select: this.publicUserSelect } }
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async updateStatus(id: string, dto: PatchProjectStatusDto, userId: string) {
    const project = await this.findOne(id);
    if (project.status === ProjectStatus.FINALIZADA && dto.status !== ProjectStatus.FINALIZADA) {
      throw new BadRequestException('No se puede cambiar el estado de un proyecto finalizado');
    }

    if (dto.status === ProjectStatus.INICIO && !dto.estimatedDeliveryDate && !project.estimatedDeliveryDate) {
      throw new BadRequestException('La fecha estimada de finalización es obligatoria en estado INICIO');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: dto.status,
        estimatedDeliveryDate: this.toDate(dto.estimatedDeliveryDate) ?? project.estimatedDeliveryDate,
      },
    });

    await this.prisma.projectStatusHistory.create({
      data: {
        projectId: id,
        previousStatus: project.status,
        nextStatus: dto.status,
        changedById: userId,
        note: dto.note,
      },
    });

    await this.auditLogsService.create({
      actorUserId: userId,
      action: 'UPDATE_PROJECT_STATUS',
      entityType: 'Project',
      entityId: id,
      metadata: { previousStatus: project.status, nextStatus: dto.status, note: dto.note },
    });

    return updated;
  }

  async calculateProgress(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const total = project.tasks.length;
    const completed = project.tasks.filter((task) => task.status === 'COMPLETADA').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    if (project.progress !== progress) {
      await this.prisma.project.update({ where: { id: projectId }, data: { progress } });
    }
    return progress;
  }

  private toDate(dateStr?: string | null): Date | null | undefined {
    if (dateStr === undefined) return undefined;
    if (!dateStr || dateStr.trim() === '') return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }
}
