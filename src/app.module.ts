import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkTypesModule } from './work-types/work-types.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { QuotesModule } from './quotes/quotes.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { FilesModule } from './files/files.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectResourcesModule } from './project-resources/project-resources.module';
import { PrismaModule } from './prisma/prisma.module';
import { ViewerModule } from './viewer/viewer.module';
import { ConfigModule } from './config/config.module';
import { CommentsModule } from './projects/comments/comments.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkTypesModule,
    ProjectsModule,
    TasksModule,
    QuotesModule,
    AuditLogsModule,
    FilesModule,
    DashboardModule,
    ProjectResourcesModule,
    ViewerModule,
    CommentsModule,
  ],
})
export class AppModule {}
