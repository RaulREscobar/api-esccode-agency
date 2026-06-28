import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { NewQuoteVersionDto } from './dto/new-quote-version.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QuoteStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService, private auditLogsService: AuditLogsService) {}

  private readonly publicUserSelect = {
    id: true,
    email: true,
    role: true,
    isActive: true,
    assignedProjectId: true,
    createdAt: true,
    updatedAt: true,
  };

  private quoteInclude() {
    return {
      items: true,
      createdBy: { select: this.publicUserSelect },
      project: { select: { id: true, name: true, clientDisplayName: true, status: true } },
    };
  }

  async findAll() {
    return this.prisma.quote.findMany({
      include: this.quoteInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForProject(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.quote.findMany({
      where: { projectId },
      include: this.quoteInclude(),
      orderBy: { version: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: this.quoteInclude(),
    });
    if (!quote) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return quote;
  }

  async create(projectId: string, dto: CreateQuoteDto, userId: string) {
    await this.ensureProject(projectId);
    const version = await this.nextVersion(projectId);
    const issueDate = new Date(dto.issueDate);
    const expirationDate = dto.expirationDate ? new Date(dto.expirationDate) : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const subtotal = dto.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const extrasTotal = dto.extrasTotal ?? 0;
    const total = subtotal + extrasTotal;

    const quote = await this.prisma.quote.create({
      data: {
        projectId,
        version,
        status: dto.status,
        issueDate,
        expirationDate,
        subtotal,
        extrasTotal,
        total,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: this.quoteInclude(),
    });
    const quoteWithDownloadUrl = await this.prisma.quote.update({
      where: { id: quote.id },
      data: { generatedFileUrl: `/quotes/${quote.id}/download` },
      include: this.quoteInclude(),
    });

    await this.auditLogsService.create({
      actorUserId: userId,
      action: 'CREATE_QUOTE',
      entityType: 'Quote',
      entityId: quote.id,
      metadata: { projectId, version },
    });

    return quoteWithDownloadUrl;
  }

  async createNewVersion(quoteId: string, dto: NewQuoteVersionDto, userId: string) {
    const existing = await this.findOne(quoteId);
    const projectId = existing.projectId;
    const items = dto.items?.length ? dto.items : existing.items;
    const issueDate = new Date(dto.issueDate ?? new Date());
    const expirationDate = dto.expirationDate ? new Date(dto.expirationDate) : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const extrasTotal = dto.extrasTotal ?? existing.extrasTotal;
    const total = subtotal + extrasTotal;
    const version = await this.nextVersion(projectId);

    const quote = await this.prisma.quote.create({
      data: {
        projectId,
        version,
        status: dto.status ?? QuoteStatus.COTIZACION_PENDIENTE,
        issueDate,
        expirationDate,
        subtotal,
        extrasTotal,
        total,
        createdById: userId,
        items: {
          create: items.map((item) => ({
            name: item.name,
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: this.quoteInclude(),
    });
    const quoteWithDownloadUrl = await this.prisma.quote.update({
      where: { id: quote.id },
      data: { generatedFileUrl: `/quotes/${quote.id}/download` },
      include: this.quoteInclude(),
    });

    await this.auditLogsService.create({
      actorUserId: userId,
      action: 'CREATE_QUOTE_VERSION',
      entityType: 'Quote',
      entityId: quote.id,
      metadata: { projectId, version, previousQuoteId: quoteId },
    });

    return quoteWithDownloadUrl;
  }

  async streamPdf(id: string, res: any) {
    const quote = await this.findOne(id);
    const project = await this.prisma.project.findUnique({ where: { id: quote.projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${quote.version}-${project.name}.pdf"`,
    });
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = new PassThrough();
    doc.pipe(stream);

    doc.fontSize(20).text('EscCode', { align: 'left' });
    doc.fontSize(12).text(`Cotización v${quote.version}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(14).text(project.name);
    doc.fontSize(10).text(`Cliente: ${project.clientDisplayName}`);
    doc.text(`Estado: ${quote.status}`);
    doc.text(`Emisión: ${quote.issueDate.toISOString().split('T')[0]}`);
    doc.text(`Vencimiento: ${quote.expirationDate.toISOString().split('T')[0]}`);
    doc.moveDown();

    doc.text('Items:', { underline: true });
    quote.items.forEach((item) => {
      doc.moveDown(0.2);
      doc.fontSize(11).text(item.name);
      if (item.description) {
        doc.fontSize(9).fillColor('gray').text(item.description);
      }
      doc.fontSize(10).text(`Cantidad: ${item.quantity} • Unitario: $${item.unitPrice.toFixed(2)} • Total: $${item.total.toFixed(2)}`);
    });

    doc.moveDown();
    doc.text(`Subtotal: $${quote.subtotal.toFixed(2)}`);
    doc.text(`Extras: $${quote.extrasTotal.toFixed(2)}`);
    doc.text(`Total: $${quote.total.toFixed(2)}`, { underline: true });

    doc.end();
    stream.pipe(res);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireQuotes() {
    const now = new Date();
    await this.prisma.quote.updateMany({
      where: {
        status: QuoteStatus.COTIZACION_FINALIZADA,
        expirationDate: { lt: now },
      },
      data: { status: QuoteStatus.COTIZACION_VENCIDA },
    });
  }

  private async nextVersion(projectId: string) {
    const count = await this.prisma.quote.count({ where: { projectId } });
    return count + 1;
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }
}
