import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  private checkViewerAccess(req: any, projectId: string) {
    if (req.user.role === UserRole.VIEWER && req.user.assignedProjectId !== projectId) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
  }

  @Get('projects/:projectId/folders/:folderType')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.VIEWER)
  async listFiles(
    @Param('projectId') projectId: string,
    @Param('folderType') folderType: string,
    @Request() req: any,
  ) {
    this.checkViewerAccess(req, projectId);
    return this.filesService.listFiles(projectId, folderType);
  }

  @Post('projects/:projectId/folders/:folderType/upload')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('projectId') projectId: string,
    @Param('folderType') folderType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.filesService.saveFile(projectId, folderType, file);
  }

  @Get('projects/:projectId/folders/:folderType/download/:filename')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.VIEWER)
  async downloadFile(
    @Param('projectId') projectId: string,
    @Param('folderType') folderType: string,
    @Param('filename') filename: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    this.checkViewerAccess(req, projectId);
    const fileStream = this.filesService.getFileReadStream(projectId, folderType, filename);
    fileStream.pipe(res);
  }
}
