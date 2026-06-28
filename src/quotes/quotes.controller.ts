import { Controller, Get, Post, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { NewQuoteVersionDto } from './dto/new-quote-version.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get('quotes')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  findAll() {
    return this.quotesService.findAll();
  }

  @Get('projects/:projectId/quotes')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  findAllForProject(@Param('projectId') projectId: string) {
    return this.quotesService.findAllForProject(projectId);
  }

  @Post('projects/:projectId/quotes')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  create(@Param('projectId') projectId: string, @Body() dto: CreateQuoteDto, @Request() req: any) {
    return this.quotesService.create(projectId, dto, req.user.id);
  }

  @Get('quotes/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Post('quotes/:id/new-version')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  createVersion(@Param('id') id: string, @Body() dto: NewQuoteVersionDto, @Request() req: any) {
    return this.quotesService.createNewVersion(id, dto, req.user.id);
  }

  @Get('quotes/:id/download')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async download(@Param('id') id: string, @Res() res: Response) {
    await this.quotesService.streamPdf(id, res);
  }
}
