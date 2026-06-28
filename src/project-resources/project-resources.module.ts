import { Module } from '@nestjs/common';
import { ProjectResourcesService } from './project-resources.service';
import { ProjectResourcesController } from './project-resources.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProjectResourcesService],
  controllers: [ProjectResourcesController],
  exports: [ProjectResourcesService],
})
export class ProjectResourcesModule {}
