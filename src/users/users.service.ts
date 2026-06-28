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
    const user = await this.prisma.user.findUnique({ where: { id } });
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
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
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

    if (createUserDto.assignedProjectId) {
      const project = await this.prisma.project.findUnique({ where: { id: createUserDto.assignedProjectId } });
      if (!project) {
        throw new NotFoundException('Proyecto asignado no encontrado');
      }
    }

    const passwordHash = await argon2.hash(createUserDto.password);
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
        isActive: createUserDto.isActive ?? true,
        assignedProjectId: createUserDto.assignedProjectId || null,
      },
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

    if (patchUserDto.assignedProjectId !== undefined) {
      if (patchUserDto.assignedProjectId !== null) {
        const project = await this.prisma.project.findUnique({ where: { id: patchUserDto.assignedProjectId } });
        if (!project) {
          throw new NotFoundException('Proyecto asignado no encontrado');
        }
      }
      data.assignedProjectId = patchUserDto.assignedProjectId;
    }

    const updated = await this.prisma.user.update({ where: { id }, data });
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
