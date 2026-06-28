import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DriveService {
  private drive;
  private rootFolderId?: string;

  constructor(private configService: ConfigService) {
    const email = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');
    this.rootFolderId = this.configService.get<string>('GOOGLE_DRIVE_ROOT_FOLDER_ID');

    if (email && privateKey && this.rootFolderId) {
      const auth = new google.auth.JWT({
        email,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      this.drive = google.drive({ version: 'v3', auth });
    }
  }

  async createProjectStructure(projectName: string) {
    if (!this.drive) {
      throw new InternalServerErrorException('Google Drive credentials no configuradas');
    }

    if (!this.rootFolderId) {
      throw new InternalServerErrorException('Google Drive root folder ID no configurado');
    }

    const rootFolder = await this.createFolder(projectName, this.rootFolderId);
    const folderNames = [
      'img',
      'Logos',
      'videos',
      'diseño',
      'Textos del sitio',
      'info',
      'Presupuesto realizado',
      'Tareas a realizar',
      'Backup',
      'Requisitos',
    ];
    const folders = [] as Array<{ name: string; driveFolderId: string; driveUrl: string; parentDriveFolderId: string }>; 
    for (const name of folderNames) {
      if (!rootFolder.driveFolderId) {
        throw new InternalServerErrorException('Root folder ID no disponible');
      }
      const folder = await this.createFolder(name, rootFolder.driveFolderId);
      if (!folder.name || !folder.driveFolderId || !folder.driveUrl) {
        throw new InternalServerErrorException('Folder creation returned incomplete data');
      }
      folders.push({
        name: folder.name,
        driveFolderId: folder.driveFolderId,
        driveUrl: folder.driveUrl,
        parentDriveFolderId: rootFolder.driveFolderId,
      });
    }

    return {
      root: rootFolder,
      children: folders,
    };
  }

  private async createFolder(name: string, parentId: string) {
    if (!this.drive) {
      throw new InternalServerErrorException('Google Drive no inicializado');
    }
    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id,name,webViewLink',
    });

    const file = response.data;
    return {
      name: file.name,
      driveFolderId: file.id,
      driveUrl: file.webViewLink,
    };
  }
}
