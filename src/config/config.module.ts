import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        ENCRYPTION_KEY: Joi.string().min(32).required(),
        GOOGLE_CLIENT_EMAIL: Joi.string().optional(),
        GOOGLE_PRIVATE_KEY: Joi.string().optional(),
        GOOGLE_DRIVE_ROOT_FOLDER_ID: Joi.string().optional(),
        PORT: Joi.number().default(3000),
      }),
    }),
  ],
})
export class ConfigModule {}
