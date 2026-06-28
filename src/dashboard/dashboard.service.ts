import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus, QuoteStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string, role: string) {
    const now = new Date();
    
    // Filtro condicional por rol de usuario
    const projectFilter = role === 'OWNER' ? {} : {
      OR: [
        { createdById: userId },
        { assignedUsers: { some: { id: userId } } },
      ],
    };

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      waitingProjects,
      pendingQuotes,
      tasksPending,
      tasksInProgress,
      upcomingDeliveries,
    ] = await this.prisma.$transaction([
      this.prisma.project.count({ where: projectFilter }),
      this.prisma.project.count({ where: { ...projectFilter, status: ProjectStatus.EN_PROCESO } }),
      this.prisma.project.count({ where: { ...projectFilter, status: ProjectStatus.FINALIZADA } }),
      this.prisma.project.count({ where: { ...projectFilter, status: ProjectStatus.ESPERANDO_MATERIAL } }),
      this.prisma.quote.count({
        where: {
          status: QuoteStatus.COTIZACION_PENDIENTE,
          project: projectFilter,
        },
      }),
      this.prisma.task.count({
        where: {
          status: TaskStatus.PENDIENTE,
          project: projectFilter,
        },
      }),
      this.prisma.task.count({
        where: {
          status: TaskStatus.EN_PROCESO,
          project: projectFilter,
        },
      }),
      this.prisma.project.findMany({
        where: {
          ...projectFilter,
          estimatedDeliveryDate: { gte: now },
          status: { not: ProjectStatus.FINALIZADA },
        },
        orderBy: { estimatedDeliveryDate: 'asc' },
        take: 5,
        select: { id: true, name: true, estimatedDeliveryDate: true, status: true },
      }),
    ]);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      waitingProjects,
      pendingQuotes,
      tasksPending,
      tasksInProgress,
      upcomingDeliveries,
      inProgress: activeProjects,
      finished: completedProjects,
      waiting: waitingProjects,
    };
  }
}
