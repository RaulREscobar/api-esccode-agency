import { Module } from '@nestjs/common';
import { DriveService } from './drive.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [DriveService],
  exports: [DriveService],
})
export class DriveModule {}
