import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  private readonly authorSelect = {
    id: true,
    email: true,
    role: true,
    isActive: true,
  };

  async findAll(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.projectComment.findMany({
      where: { projectId },
      include: {
        author: { select: this.authorSelect },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(projectId: string, content: string, userId: string) {
    await this.ensureProject(projectId);

    const comment = await this.prisma.projectComment.create({
      data: {
        projectId,
        content,
        authorId: userId,
      },
      include: {
        author: { select: this.authorSelect },
      },
    });

    await this.auditLogsService.create({
      actorUserId: userId,
      action: 'CREATE_PROJECT_COMMENT',
      entityType: 'ProjectComment',
      entityId: comment.id,
      metadata: { projectId },
    });

    return comment;
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }
}
