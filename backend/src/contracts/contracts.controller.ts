import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
const PDFDocument = require('pdfkit');
import { ContractTemplatesService } from './contract-templates.service';
import { ContractsService } from './contracts.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('contracts')
export class ContractsController {
  constructor(
    private templatesService: ContractTemplatesService,
    private contractsService: ContractsService,
  ) {}

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  getTemplates(@Req() req: any) {
    const userId = req.user.role === 'super_admin' ? undefined : req.user.id;
    return this.templatesService.findAll(userId);
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard)
  getTemplate(@Param('id') id: string) { return this.templatesService.findById(+id); }

  @Post('templates')
  @UseGuards(JwtAuthGuard)
  createTemplate(@Req() req: any, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto, req.user.id);
  }

  @Get('templates/:id/pdf')
  @UseGuards(JwtAuthGuard)
  async getTemplatePdf(@Param('id') id: string, @Res() res: Response) {
    const tpl = await this.templatesService.findById(+id);
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="plantilla-${tpl.id}.pdf"`);
    doc.pipe(res);

    const ml = 60;
    const pw = 475;

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000')
      .text(tpl.name.toUpperCase(), ml, 60, { width: pw, align: 'center' });
    doc.moveDown(1.5);

    const lines = tpl.content.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (doc.y > 720) { doc.addPage(); doc.y = 60; }

      if (trimmed.match(/^CONTRATO|^ACUERDO/) || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/)) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#000');
        doc.moveDown(0.5);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'center' });
        doc.moveDown(0.5);
      } else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULAS?):/i)) {
        doc.moveDown(0.4);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
        doc.text(trimmed, ml, doc.y, { width: pw });
        doc.moveDown(0.3);
      } else if (trimmed.match(/^(CONSIDERANDO|PARTE )/i)) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000');
        doc.text(trimmed, ml, doc.y, { width: pw });
        doc.moveDown(0.2);
      } else if (trimmed.match(/^_{3,}/)) {
        doc.moveDown(0.5);
      } else if (trimmed === '') {
        doc.moveDown(0.3);
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#000');
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'justify', lineGap: 2 });
        doc.moveDown(0.3);
      }
    }

    doc.end();
  }

  @Put('templates/:id')
  @UseGuards(JwtAuthGuard)
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) { return this.templatesService.update(+id, dto); }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard)
  deleteTemplate(@Param('id') id: string) { return this.templatesService.remove(+id); }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any) {
    const filters: any = {};
    if (req.user.role === 'admin_tenant') filters.tenantUserId = req.user.id;
    return this.contractsService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { return this.contractsService.findById(+id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() body: any) {
    return this.contractsService.create({
      ...body,
      tenantUserId: body.tenantUserId || req.user.id,
      tenantName: body.tenantName || req.user.name,
    });
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.contractsService.updateStatus(+id, body.status as any);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const contract = await this.contractsService.findById(+id);
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrato-${String(contract.id).padStart(6, '0')}.pdf"`);
    doc.pipe(res);

    const ml = 60;
    const pw = 475;

    // Title
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000')
      .text(contract.title.toUpperCase(), ml, 60, { width: pw, align: 'center' });

    // Contract number and date
    const contractNumber = `N° ${String(contract.id).padStart(6, '0')}`;
    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.fontSize(9).font('Helvetica').fillColor('#000')
      .text(`${contractNumber} · ${dateStr}`, ml, 85, { width: pw, align: 'center' });

    doc.moveDown(1);

    // Parties
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000')
      .text('CONTRATANTE', ml, doc.y, { continued: true })
      .font('Helvetica').fillColor('#000')
      .text(`    ${contract.tenantName || `Usuario ID ${contract.tenantUserId}`}`);
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000')
      .text('CONTRATISTA', ml, doc.y, { continued: true })
      .font('Helvetica').fillColor('#000')
      .text(`    ${contract.freelancerName || `Usuario ID ${contract.freelancerUserId}`}`);

    doc.moveDown(1);
    doc.moveTo(ml, doc.y).lineTo(ml + pw, doc.y).lineWidth(0.5).strokeColor('#000').stroke();
    doc.moveDown(1);

    // Content
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const text = stripHtml(contract.content);
    const lines = text.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (doc.y > 720) { doc.addPage(); doc.y = 60; }

      if (trimmed.match(/^CONTRATO|^ACUERDO/) || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/)) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#000');
        doc.moveDown(0.5);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'center' });
        doc.moveDown(0.5);
      } else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULAS?):/i)) {
        doc.moveDown(0.4);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
        doc.text(trimmed, ml, doc.y, { width: pw });
        doc.moveDown(0.3);
      } else if (trimmed.match(/^(CONSIDERANDO|PARTE )/i)) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000');
        doc.text(trimmed, ml, doc.y, { width: pw });
        doc.moveDown(0.2);
      } else if (trimmed.match(/^_{3,}/)) {
        doc.moveDown(0.5);
      } else if (trimmed === '') {
        doc.moveDown(0.3);
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#000');
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'justify', lineGap: 2 });
        doc.moveDown(0.3);
      }
    }

    // Signatures
    if (doc.y > 620) { doc.addPage(); doc.y = 60; }
    doc.moveDown(2);
    doc.moveTo(ml, doc.y).lineTo(ml + pw, doc.y).lineWidth(0.5).strokeColor('#000').stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000')
      .text('FIRMAS', ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(1.5);

    const sigLineW = 180;
    const leftX = ml + 10;
    const rightX = ml + pw - 10 - sigLineW;
    const sigY = doc.y;

    doc.moveTo(leftX, sigY).lineTo(leftX + sigLineW, sigY).lineWidth(1).strokeColor('#000').stroke();
    doc.moveTo(rightX, sigY).lineTo(rightX + sigLineW, sigY).lineWidth(1).strokeColor('#000').stroke();

    doc.fontSize(9).font('Helvetica').fillColor('#000')
      .text(contract.tenantName || 'CONTRATANTE', leftX, sigY + 5, { width: sigLineW, align: 'center' });
    doc.text(contract.freelancerName || 'CONTRATISTA', rightX, sigY + 5, { width: sigLineW, align: 'center' });

    doc.fontSize(7).font('Helvetica').fillColor('#000')
      .text('CONTRATANTE', leftX, sigY + 18, { width: sigLineW, align: 'center' });
    doc.text('CONTRATISTA', rightX, sigY + 18, { width: sigLineW, align: 'center' });

    doc.end();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_tenant')
  remove(@Param('id') id: string) { return this.contractsService.remove(+id); }
}
