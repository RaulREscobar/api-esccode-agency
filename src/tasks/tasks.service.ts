import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        project: {
          select: { id: true, name: true, clientDisplayName: true, status: true },
        },
        assignedTo: { select: { id: true, email: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAllForUser(userId: string, role: string) {
    if (role === 'OWNER') {
      return this.findAll();
    }

    return this.prisma.task.findMany({
      where: {
        project: {
          OR: [
            { createdById: userId },
            { assignedUsers: { some: { id: userId } } }
          ]
        }
      },
      include: {
        project: {
          select: { id: true, name: true, clientDisplayName: true, status: true },
        },
        assignedTo: { select: { id: true, email: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAllForProject(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.task.findMany({
      where: { projectId },
      include: { assignedTo: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, clientDisplayName: true, status: true },
        },
        assignedTo: { select: { id: true, email: true, role: true } },
      },
    });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return task;
  }

  async create(projectId: string, dto: CreateTaskDto) {
    const project = await this.ensureProject(projectId);
    if (project.status === 'FINALIZADA') {
      throw new BadRequestException('No se pueden crear tareas en un proyecto finalizado');
    }

    if (dto.assignedToId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
        include: { assignedProjects: true },
      });
      if (!assignedUser) {
        throw new NotFoundException('Usuario asignado no encontrado');
      }
      if (assignedUser.role !== 'OWNER') {
        const isCreator = project.createdById === dto.assignedToId;
        const isAssigned = assignedUser.assignedProjects.some((p) => p.id === projectId);
        if (!isCreator && !isAssigned) {
          throw new BadRequestException('El usuario asignado no pertenece a este proyecto');
        }
      }
    }

    const task = await this.prisma.task.create({
      data: { ...dto, projectId },
      include: { assignedTo: { select: { id: true, email: true, role: true } } },
    });
    await this.recalculateProjectProgress(projectId);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const project = await this.ensureProject(existing.projectId);
    if (project.status === 'FINALIZADA') {
      throw new BadRequestException('No se pueden editar tareas en un proyecto finalizado');
    }

    if (dto.assignedToId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
        include: { assignedProjects: true },
      });
      if (!assignedUser) {
        throw new NotFoundException('Usuario asignado no encontrado');
      }
      if (assignedUser.role !== 'OWNER') {
        const isCreator = project.createdById === dto.assignedToId;
        const isAssigned = assignedUser.assignedProjects.some((p) => p.id === existing.projectId);
        if (!isCreator && !isAssigned) {
          throw new BadRequestException('El usuario asignado no pertenece a este proyecto');
        }
      }
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: dto,
      include: { assignedTo: { select: { id: true, email: true, role: true } } },
    });
    await this.recalculateProjectProgress(existing.projectId);
    return task;
  }

  async remove(id: string) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tarea no encontrada');
    }
    const project = await this.ensureProject(existing.projectId);
    if (project.status === 'FINALIZADA') {
      throw new BadRequestException('No se pueden eliminar tareas en un proyecto finalizado');
    }
    const deleted = await this.prisma.task.delete({ where: { id } });
    await this.recalculateProjectProgress(existing.projectId);
    return deleted;
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  private async recalculateProjectProgress(projectId: string) {
    const tasks = await this.prisma.task.findMany({ where: { projectId } });
    const completed = tasks.filter((task) => task.status === TaskStatus.COMPLETADA).length;
    const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
    await this.prisma.project.update({ where: { id: projectId }, data: { progress } });
  }
}
