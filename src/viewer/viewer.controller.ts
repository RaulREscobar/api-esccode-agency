import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ProjectsService } from '../projects/projects.service';

@Controller('viewer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VIEWER)
export class ViewerController {
  constructor(private projectsService: ProjectsService) {}

  @Get('project')
  async getProject(@CurrentUser() user: any) {
    if (!user.assignedProjects || user.assignedProjects.length === 0) {
      return { message: 'No hay proyecto asignado' };
    }
    return this.projectsService.findOne(user.assignedProjects[0].id);
  }
}
