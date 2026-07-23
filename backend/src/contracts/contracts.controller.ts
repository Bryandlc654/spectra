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

    const c = '#006d70'; const ml = 60; const pw = 475;

    doc.rect(ml, 40, pw, 60).lineWidth(2).strokeColor(c).stroke();
    doc.fontSize(18).font('Helvetica-Bold').fillColor(c).text(tpl.name, ml, 52, { align: 'center', width: pw });
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#999').text('Vista previa de plantilla', { align: 'center', width: pw });

    const divY = 120;
    doc.moveTo(ml, divY).lineTo(ml + pw, divY).lineWidth(1.5).strokeColor(c).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#999').text('CONTENIDO', ml, divY + 6, { align: 'center', width: pw });

    let currentY = divY + 22;
    const lines = tpl.content.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (currentY > 720) { doc.addPage(); currentY = 60; }
      if (trimmed.startsWith('CONTRATO') || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{4,}$/)) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(c); currentY += 4;
      } else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA):/)) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(c); currentY += 4;
      } else { doc.font('Helvetica').fontSize(10).fillColor('#333'); }
      doc.text(trimmed, ml, currentY, { width: pw, align: 'justify', lineGap: 2 });
      currentY = doc.y + 4;
    }

    const footerY = Math.max(currentY + 30, 700);
    doc.moveTo(ml, footerY).lineTo(ml + pw, footerY).lineWidth(0.5).strokeColor('#ddd').stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor('#aaa')
      .text('Spectra Platform · Vista previa generada electrónicamente', ml, footerY + 5, { align: 'center', width: pw });
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
    res.setHeader('Content-Disposition', `attachment; filename="contrato-${contract.id}.pdf"`);
    doc.pipe(res);

    const c = '#006d70';
    const ml = 60;
    const pw = 475;

    // --- Header box ---
    doc.rect(ml, 40, pw, 90).lineWidth(2).strokeColor(c).stroke();
    doc.fontSize(20).font('Helvetica-Bold').fillColor(c)
      .text(contract.title, ml, 55, { align: 'center', width: pw });
    doc.fontSize(9).font('Helvetica').fillColor('#666')
      .text(`N° ${String(contract.id).padStart(6, '0')} · ${new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center', width: pw });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#999')
      .text('Documento electrónico con validez legal', { align: 'center', width: pw });

    // --- Parties info ---
    const infoY = 150;
    doc.rect(ml, infoY - 5, pw, 55).lineWidth(0.5).strokeColor('#ddd').stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
      .text('CONTRATANTE', ml + 10, infoY + 3);
    doc.fontSize(9.5).font('Helvetica').fillColor('#333')
      .text(contract.tenantName || `ID ${contract.tenantUserId}`, ml + 10, infoY + 18);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
      .text('CONTRATISTA', ml + pw / 2 + 5, infoY + 3);
    doc.fontSize(9.5).font('Helvetica').fillColor('#333')
      .text(contract.freelancerName || `ID ${contract.freelancerUserId}`, ml + pw / 2 + 5, infoY + 18);

    // --- Divider ---
    const divY = infoY + 60;
    doc.moveTo(ml, divY).lineTo(ml + pw, divY).lineWidth(1.5).strokeColor(c).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#999')
      .text('CLÁUSULAS', ml, divY + 6, { align: 'center', width: pw });

    // --- Content ---
    const startY = divY + 22;
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const text = stripHtml(contract.content);
    const lines = text.split('\n').filter((l) => l.trim());

    let currentY = startY;
    const lineHeight = 18;

    for (const line of lines) {
      const trimmed = line.trim();
      if (currentY > 720) {
        doc.addPage();
        currentY = 60;
      }

      if (trimmed.startsWith('CONTRATO') || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{4,}$/)) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(c);
        currentY += 4;
      } else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA):/)) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(c);
        currentY += 4;
      } else if (trimmed.startsWith('_') || trimmed.match(/^_{3,}/)) {
        currentY += 8;
        continue;
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#333');
      }

      doc.text(trimmed, ml, currentY, { width: pw, align: 'justify', lineGap: 2 });
      currentY = doc.y + 4;
    }

    // --- Signature section ---
    if (currentY > 660) doc.addPage();
    const sigY = Math.max(currentY + 30, 680);
    doc.moveTo(ml, sigY).lineTo(ml + pw, sigY).lineWidth(0.5).strokeColor('#ccc').stroke();

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333')
      .text('FIRMAS', ml, sigY + 10, { align: 'center', width: pw });

    const lineLen = 180;
    const gap = 30;
    const sigLineY = sigY + 45;

    doc.moveTo(ml + 40, sigLineY).lineTo(ml + 40 + lineLen, sigLineY).lineWidth(1).strokeColor('#333').stroke();
    doc.moveTo(ml + pw - 40 - lineLen, sigLineY).lineTo(ml + pw - 40, sigLineY).lineWidth(1).strokeColor('#333').stroke();

    doc.fontSize(9).font('Helvetica').fillColor('#333')
      .text(contract.tenantName || 'CONTRATANTE', ml + 40, sigLineY + 5, { width: lineLen, align: 'center' });
    doc.text(contract.freelancerName || 'CONTRATISTA', ml + pw - 40 - lineLen, sigLineY + 5, { width: lineLen, align: 'center' });

    doc.fontSize(7).font('Helvetica-Oblique').fillColor('#999')
      .text('CONTRATANTE', ml + 40, sigLineY + 18, { width: lineLen, align: 'center' });
    doc.text('CONTRATISTA', ml + pw - 40 - lineLen, sigLineY + 18, { width: lineLen, align: 'center' });

    // --- Footer ---
    const footerY = sigLineY + 45;
    doc.moveTo(ml, footerY).lineTo(ml + pw, footerY).lineWidth(0.5).strokeColor('#ddd').stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor('#aaa')
      .text('Spectra Platform · Documento generado electrónicamente · ID: ' + contract.id, ml, footerY + 5, { align: 'center', width: pw });

    doc.end();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_tenant')
  remove(@Param('id') id: string) { return this.contractsService.remove(+id); }
}
