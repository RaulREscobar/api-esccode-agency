import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';

@Injectable()
export class WorkTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.workType.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const existing = await this.prisma.workType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tipo de trabajo no encontrado');
    }
    return existing;
  }

  async create(dto: CreateWorkTypeDto) {
    return this.prisma.workType.create({ data: dto });
  }

  async update(id: string, dto: UpdateWorkTypeDto) {
    await this.ensureExists(id);
    return this.prisma.workType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.workType.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    await this.findOne(id);
  }
}
