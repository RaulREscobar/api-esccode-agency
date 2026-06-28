import { Module } from '@nestjs/common';
import { ViewerController } from './viewer.controller';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ProjectsModule, UsersModule],
  controllers: [ViewerController],
})
export class ViewerModule {}
