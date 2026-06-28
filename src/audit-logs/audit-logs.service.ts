import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  private readonly publicUserSelect = {
    id: true,
    email: true,
    role: true,
    isActive: true,
    assignedProjectId: true,
    createdAt: true,
    updatedAt: true,
  };

  async create(entry: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({ data: entry });
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      include: { actorUser: { select: this.publicUserSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
