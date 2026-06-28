import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ProjectResourcesService } from './project-resources.service';
import { CreateProjectResourceFieldDto } from './dto/create-project-resource-field.dto';
import { UpdateProjectResourceFieldDto } from './dto/update-project-resource-field.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('projects/:projectId/resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
export class ProjectResourcesController {
  constructor(private projectResourcesService: ProjectResourcesService) {}

  @Get()
  getResources(@Param('projectId') projectId: string) {
    return this.projectResourcesService.getResources(projectId);
  }

  @Post('fields')
  createField(@Param('projectId') projectId: string, @Body() dto: CreateProjectResourceFieldDto) {
    return this.projectResourcesService.createField(projectId, dto);
  }

  @Patch('fields/:fieldId')
  updateField(
    @Param('projectId') projectId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateProjectResourceFieldDto,
  ) {
    return this.projectResourcesService.updateField(projectId, fieldId, dto);
  }
}
