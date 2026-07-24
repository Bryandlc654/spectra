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
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="plantilla-${tpl.id}.pdf"`);
    doc.pipe(res);

    const c = '#006d70';
    const cDark = '#004d50';
    const ml = 50;
    const mr = 50;
    const pw = 595 - ml - mr;
    const pageW = 595;

    // Top accent line
    doc.rect(0, 0, pageW, 4).fill(c);

    // Header box
    doc.roundedRect(ml, 25, pw, 90, 4).lineWidth(1.5).strokeColor(c).stroke();

    doc.fontSize(11).font('Helvetica-Bold').fillColor(c)
      .text('SPECTRA', ml + 20, 35, { width: pw - 40 });
    doc.fontSize(7).font('Helvetica').fillColor('#999')
      .text('PLATAFORMA DE GESTIÓN PROFESIONAL', ml + 20, 50, { width: pw - 40 });

    doc.moveTo(ml + 20, 62).lineTo(ml + pw - 20, 62).lineWidth(0.5).strokeColor('#ddd').stroke();

    doc.fontSize(14).font('Helvetica-Bold').fillColor(cDark)
      .text(tpl.name.toUpperCase(), ml + 20, 70, { width: pw - 40, align: 'center' });

    doc.fontSize(7).font('Helvetica-Oblique').fillColor('#aaa')
      .text('Vista previa de plantilla', ml + 20, 92, { width: pw - 40, align: 'center' });

    doc.rect(0, 120, pageW, 1).fill(c);

    // Content
    let currentY = 135;
    const lines = tpl.content.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (currentY > 750) { doc.addPage(); currentY = 50; }

      if (trimmed.match(/^CONTRATO|^ACUERDO/) || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/)) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor(cDark);
        currentY += 6;
        doc.text(trimmed, ml, currentY, { width: pw, align: 'center', lineGap: 1 });
        currentY = doc.y + 6;
      } else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULAS?):/i)) {
        currentY += 6;
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(c);
        doc.text(trimmed, ml, currentY, { width: pw, lineGap: 1 });
        currentY = doc.y + 4;
      } else if (trimmed.match(/^(CONSIDERANDO|PARTE )/i)) {
        currentY += 4;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555');
        doc.text(trimmed, ml, currentY, { width: pw, lineGap: 1 });
        currentY = doc.y + 3;
      } else if (trimmed.match(/^_{3,}/) || trimmed.match(/^─{3,}/)) {
        currentY += 6;
      } else if (trimmed === '' || trimmed.match(/^={3,}/)) {
        currentY += 4;
      } else {
        doc.font('Helvetica').fontSize(9.5).fillColor('#333');
        doc.text(trimmed, ml, currentY, { width: pw, align: 'justify', lineGap: 2 });
        currentY = doc.y + 3;
      }
    }

    // Footer
    doc.moveTo(ml, 800).lineTo(ml + pw, 800).lineWidth(0.3).strokeColor('#ddd').stroke();
    doc.fontSize(7).font('Helvetica').fillColor('#bbb')
      .text('Spectra Platform · Vista previa de plantilla', ml, 805, { width: pw, align: 'center' });

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
    const doc = new PDFDocument({ margin: 50, size: 'A4', info: {
      Title: contract.title,
      Author: 'Spectra Platform',
      Subject: 'Contrato Profesional',
      Creator: 'Spectra Platform',
    }});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrato-${String(contract.id).padStart(6, '0')}.pdf"`);
    doc.pipe(res);

    const c = '#006d70';
    const cDark = '#004d50';
    const ml = 50;
    const mr = 50;
    const pw = 595 - ml - mr;
    const pageW = 595;
    const totalPages = () => doc.bufferedPageRange().count;

    const drawPageNumber = (pg: number) => {
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      doc.text(`Página ${pg}`, ml, 810, { width: pw, align: 'center' });
      doc.moveTo(ml, 800).lineTo(ml + pw, 800).lineWidth(0.3).strokeColor('#ddd').stroke();
    };

    const drawHeader = () => {
      // Top accent line
      doc.rect(0, 0, pageW, 4).fill(c);

      // Header box
      doc.roundedRect(ml, 25, pw, 100, 4).lineWidth(1.5).strokeColor(c).stroke();

      // Logo area / brand
      doc.fontSize(11).font('Helvetica-Bold').fillColor(c)
        .text('SPECTRA', ml + 20, 35, { width: pw - 40 });
      doc.fontSize(7).font('Helvetica').fillColor('#999')
        .text('PLATAFORMA DE GESTIÓN PROFESIONAL', ml + 20, 50, { width: pw - 40 });

      // Separator line inside header
      doc.moveTo(ml + 20, 62).lineTo(ml + pw - 20, 62).lineWidth(0.5).strokeColor('#ddd').stroke();

      // Title
      doc.fontSize(16).font('Helvetica-Bold').fillColor(cDark)
        .text(contract.title.toUpperCase(), ml + 20, 72, { width: pw - 40, align: 'center' });

      // Contract number and date
      const contractNumber = `N° ${String(contract.id).padStart(6, '0')}`;
      const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.fontSize(9).font('Helvetica').fillColor('#666')
        .text(`${contractNumber} · ${dateStr}`, ml + 20, 95, { width: pw - 40, align: 'center' });

      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#aaa')
        .text('Documento electrónico con validez legal', ml + 20, 108, { width: pw - 40, align: 'center' });

      // Bottom accent line
      doc.rect(0, 130, pageW, 1).fill(c);
    };

    drawHeader();
    drawPageNumber(1);

    // --- Parties section ---
    let currentY = 145;

    doc.fontSize(8).font('Helvetica-Bold').fillColor(c)
      .text('PARTES CONTRATANTES', ml, currentY, { width: pw });
    currentY += 14;

    // Parties box
    const partiesH = 52;
    doc.roundedRect(ml, currentY, pw, partiesH, 3).lineWidth(0.5).strokeColor('#e0e0e0').fillAndStroke('#fafafa', '#e0e0e0');

    // Left: Contratante
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#888')
      .text('CONTRATANTE', ml + 15, currentY + 8);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333')
      .text(contract.tenantName || `Usuario ID ${contract.tenantUserId}`, ml + 15, currentY + 22, { width: pw / 2 - 25 });

    // Right: Contratista
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#888')
      .text('CONTRATISTA', ml + pw / 2 + 5, currentY + 8);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333')
      .text(contract.freelancerName || `Usuario ID ${contract.freelancerUserId}`, ml + pw / 2 + 5, currentY + 22, { width: pw / 2 - 25 });

    // Vertical divider
    doc.moveTo(ml + pw / 2, currentY + 5).lineTo(ml + pw / 2, currentY + partiesH - 5).lineWidth(0.3).strokeColor('#ddd').stroke();

    currentY += partiesH + 15;

    // --- Content section ---
    doc.moveTo(ml, currentY).lineTo(ml + pw, currentY).lineWidth(0.5).strokeColor(c).stroke();
    currentY += 8;

    doc.fontSize(8).font('Helvetica-Bold').fillColor(c)
      .text('CONTENIDO DEL CONTRATO', ml, currentY, { width: pw, align: 'center' });
    currentY += 16;

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const text = stripHtml(contract.content);
    const lines = text.split('\n').filter((l) => l.trim());

    let pageCount = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (currentY > 750) {
        doc.addPage();
        pageCount++;
        currentY = 50;
        drawPageNumber(pageCount);
      }

      // Title lines (CONTRATO ..., header-like lines)
      if (trimmed.match(/^CONTRATO|^ACUERDO/) || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/)) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor(cDark);
        currentY += 6;
        doc.text(trimmed, ml, currentY, { width: pw, align: 'center', lineGap: 1 });
        currentY = doc.y + 6;
      }
      // Clause headers
      else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULAS?):/i)) {
        currentY += 6;
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(c);
        doc.text(trimmed, ml, currentY, { width: pw, lineGap: 1 });
        currentY = doc.y + 4;
      }
      // Considerando / heading-like lines
      else if (trimmed.match(/^(CONSIDERANDO|PARTE )/i)) {
        currentY += 4;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555');
        doc.text(trimmed, ml, currentY, { width: pw, lineGap: 1 });
        currentY = doc.y + 3;
      }
      // Signature lines / dashes
      else if (trimmed.match(/^_{3,}/) || trimmed.match(/^─{3,}/)) {
        currentY += 6;
      }
      // Empty lines / separator
      else if (trimmed === '' || trimmed.match(/^={3,}/)) {
        currentY += 4;
      }
      // Regular paragraph
      else {
        doc.font('Helvetica').fontSize(9.5).fillColor('#333');
        doc.text(trimmed, ml, currentY, { width: pw, align: 'justify', lineGap: 2 });
        currentY = doc.y + 3;
      }
    }

    // --- Signature section ---
    if (currentY > 620) {
      doc.addPage();
      pageCount++;
      currentY = 60;
      drawPageNumber(pageCount);
    }

    currentY += 20;
    doc.moveTo(ml, currentY).lineTo(ml + pw, currentY).lineWidth(0.5).strokeColor(c).stroke();
    currentY += 10;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(c)
      .text('FIRMAS', ml, currentY, { width: pw, align: 'center' });
    currentY += 8;

    doc.fontSize(7).font('Helvetica-Oblique').fillColor('#999')
      .text('Las partes firman el presente contrato en dos ejemplares del mismo tenor y a un solo efecto.', ml, currentY, { width: pw, align: 'center' });
    currentY += 20;

    const sigLineW = 170;
    const leftSigX = ml + 20;
    const rightSigX = ml + pw - 20 - sigLineW;

    // Signature lines
    doc.moveTo(leftSigX, currentY).lineTo(leftSigX + sigLineW, currentY).lineWidth(1).strokeColor('#333').stroke();
    doc.moveTo(rightSigX, currentY).lineTo(rightSigX + sigLineW, currentY).lineWidth(1).strokeColor('#333').stroke();

    currentY += 6;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
      .text(contract.tenantName || 'CONTRATANTE', leftSigX, currentY, { width: sigLineW, align: 'center' });
    doc.text(contract.freelancerName || 'CONTRATISTA', rightSigX, currentY, { width: sigLineW, align: 'center' });

    currentY += 14;
    doc.fontSize(7).font('Helvetica').fillColor('#999')
      .text('CONTRATANTE', leftSigX, currentY, { width: sigLineW, align: 'center' });
    doc.text('CONTRATISTA', rightSigX, currentY, { width: sigLineW, align: 'center' });

    // --- Footer ---
    const footerY = currentY + 30;
    doc.moveTo(ml, footerY).lineTo(ml + pw, footerY).lineWidth(0.3).strokeColor('#ddd').stroke();
    doc.fontSize(7).font('Helvetica').fillColor('#bbb')
      .text(`Spectra Platform · Documento generado electrónicamente · Contrato N° ${String(contract.id).padStart(6, '0')}`, ml, footerY + 5, { width: pw, align: 'center' });

    doc.end();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_tenant')
  remove(@Param('id') id: string) { return this.contractsService.remove(+id); }
}
