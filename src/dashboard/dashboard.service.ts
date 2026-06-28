import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus, QuoteStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
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
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: ProjectStatus.EN_PROCESO } }),
      this.prisma.project.count({ where: { status: ProjectStatus.FINALIZADA } }),
      this.prisma.project.count({ where: { status: ProjectStatus.ESPERANDO_MATERIAL } }),
      this.prisma.quote.count({ where: { status: QuoteStatus.COTIZACION_PENDIENTE } }),
      this.prisma.task.count({ where: { status: TaskStatus.PENDIENTE } }),
      this.prisma.task.count({ where: { status: TaskStatus.EN_PROCESO } }),
      this.prisma.project.findMany({
        where: {
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
