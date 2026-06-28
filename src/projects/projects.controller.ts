import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PatchProjectStatusDto } from './dto/patch-project-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  findAll(@Request() req: any) {
    return this.projectsService.findAllForUser(req.user.id, req.user.role);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  create(@Body() dto: CreateProjectDto, @Request() req: any) {
    return this.projectsService.create(dto, req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: PatchProjectStatusDto, @Request() req: any) {
    return this.projectsService.updateStatus(id, dto, req.user.id);
  }
}
