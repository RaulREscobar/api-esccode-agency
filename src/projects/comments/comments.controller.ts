import { Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('projects/:projectId/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  async findAll(@Param('projectId') projectId: string, @Request() req: any) {
    // Si es un CLIENT (VIEWER), verificar que sea su proyecto asignado
    if (req.user.role === UserRole.VIEWER && req.user.assignedProjectId !== projectId) {
      throw new ForbiddenException('No tienes permiso para ver los comentarios de este proyecto');
    }
    return this.commentsService.findAll(projectId);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: any,
  ) {
    // Si es un CLIENT (VIEWER), verificar que sea su proyecto asignado
    if (req.user.role === UserRole.VIEWER && req.user.assignedProjectId !== projectId) {
      throw new ForbiddenException('No tienes permiso para comentar en este proyecto');
    }
    return this.commentsService.create(projectId, dto.content, req.user.id);
  }
}
