import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly uploadRootDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDirectoryExists(this.uploadRootDir);
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async createProjectStructure(projectId: string) {
    const projectDir = path.join(this.uploadRootDir, 'projects', projectId);
    this.ensureDirectoryExists(projectDir);

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

    const folders = [];
    for (const name of folderNames) {
      const folderPath = path.join(projectDir, name);
      this.ensureDirectoryExists(folderPath);

      // Guardamos la ruta relativa local y URLs del API local en lugar de Google Drive
      folders.push({
        name,
        driveFolderId: `${projectId}/${name}`,
        driveUrl: `/files/projects/${projectId}/folders/${name}`,
      });
    }

    return {
      root: {
        name: 'root',
        driveFolderId: projectId,
        driveUrl: `/files/projects/${projectId}/folders/root`,
      },
      children: folders,
    };
  }

  async listFiles(projectId: string, folderType: string) {
    const targetDir = path.join(this.uploadRootDir, 'projects', projectId, folderType === 'root' ? '' : folderType);
    if (!fs.existsSync(targetDir)) {
      throw new NotFoundException('Carpeta de proyecto no encontrada');
    }

    const files = fs.readdirSync(targetDir, { withFileTypes: true });
    return files
      .filter((dirent) => dirent.isFile())
      .map((dirent) => {
        const filePath = path.join(targetDir, dirent.name);
        const stats = fs.statSync(filePath);
        return {
          name: dirent.name,
          size: stats.size,
          createdAt: stats.birthtime,
          downloadUrl: `/files/projects/${projectId}/folders/${folderType}/download/${encodeURIComponent(dirent.name)}`,
        };
      });
  }

  async saveFile(projectId: string, folderType: string, file: Express.Multer.File) {
    const targetDir = path.join(this.uploadRootDir, 'projects', projectId, folderType === 'root' ? '' : folderType);
    this.ensureDirectoryExists(targetDir);

    const filePath = path.join(targetDir, file.originalname);
    fs.writeFileSync(filePath, file.buffer);

    return {
      name: file.originalname,
      size: file.size,
      downloadUrl: `/files/projects/${projectId}/folders/${folderType}/download/${encodeURIComponent(file.originalname)}`,
    };
  }

  getFileReadStream(projectId: string, folderType: string, filename: string) {
    const filePath = path.join(this.uploadRootDir, 'projects', projectId, folderType === 'root' ? '' : folderType, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return fs.createReadStream(filePath);
  }
}
