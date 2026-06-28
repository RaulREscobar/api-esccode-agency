import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private toPublicUser(user: any) {
    const { passwordHash, refreshTokenHash, ...publicUser } = user;
    return publicUser;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { assignedProjects: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findOne(id: string) {
    const user = await this.findById(id);
    return this.toPublicUser(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { assignedProjects: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.toPublicUser(user));
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const refreshTokenHash = await argon2.hash(refreshToken);
    return this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } });
  }

  async removeRefreshToken(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.findById(userId);
    if (!user.refreshTokenHash) {
      return null;
    }
    const matches = await argon2.verify(user.refreshTokenHash, refreshToken);
    return matches ? user : null;
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existing) {
      throw new BadRequestException('El email ya está en uso');
    }

    if (createUserDto.assignedProjectIds && createUserDto.assignedProjectIds.length > 0) {
      const count = await this.prisma.project.count({
        where: { id: { in: createUserDto.assignedProjectIds } },
      });
      if (count !== createUserDto.assignedProjectIds.length) {
        throw new NotFoundException('Uno o más proyectos asignados no fueron encontrados');
      }
    }

    const passwordHash = await argon2.hash(createUserDto.password);
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
        isActive: createUserDto.isActive ?? true,
        assignedProjects: createUserDto.assignedProjectIds
          ? { connect: createUserDto.assignedProjectIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { assignedProjects: true },
    });
    return this.toPublicUser(user);
  }

  async update(id: string, patchUserDto: PatchUserDto) {
    const user = await this.findById(id);
    const data: any = {};

    if (patchUserDto.email && patchUserDto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: patchUserDto.email } });
      if (existing) {
        throw new BadRequestException('El email ya está en uso');
      }
      data.email = patchUserDto.email;
    }

    if (patchUserDto.password) {
      data.passwordHash = await argon2.hash(patchUserDto.password);
    }
    if (patchUserDto.role) {
      data.role = patchUserDto.role;
    }
    if (typeof patchUserDto.isActive === 'boolean') {
      data.isActive = patchUserDto.isActive;
    }

    if (patchUserDto.assignedProjectIds !== undefined) {
      const count = await this.prisma.project.count({
        where: { id: { in: patchUserDto.assignedProjectIds } },
      });
      if (count !== patchUserDto.assignedProjectIds.length) {
        throw new NotFoundException('Uno o más proyectos asignados no fueron encontrados');
      }
      data.assignedProjects = {
        set: patchUserDto.assignedProjectIds.map((id) => ({ id })),
      };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: { assignedProjects: true },
    });
    return this.toPublicUser(updated);
  }

  async activate(id: string) {
    await this.findById(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive: true } });
    return this.toPublicUser(updated);
  }

  async deactivate(id: string) {
    await this.findById(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return this.toPublicUser(updated);
  }
}
