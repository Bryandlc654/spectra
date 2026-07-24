import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Res, Query, ParseIntPipe } from '@nestjs/common';
import { Response } from 'express';
const PDFDocument = require('pdfkit');
import { ContractTemplatesService } from './contract-templates.service';
import { ContractsService } from './contracts.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
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
  getTemplates(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req.user.role === 'super_admin' ? undefined : req.user.id;
    return this.templatesService.findAll(userId, Number(page) || 1, Math.min(Number(limit) || 50, 100));
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard)
  getTemplate(@Param('id', ParseIntPipe) id: number) { return this.templatesService.findById(id); }

  @Post('templates')
  @UseGuards(JwtAuthGuard)
  createTemplate(@Req() req: any, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto, req.user.id);
  }

  @Get('templates/:id/pdf')
  @UseGuards(JwtAuthGuard)
  async getTemplatePdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const tpl = await this.templatesService.findById(id);
    const doc = new PDFDocument({ margin: 70, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="plantilla-${tpl.id}.pdf"`);
    doc.pipe(res);

    const ml = 70;
    const pw = 455;
    const black = '#1a1a1a';
    const gray = '#666666';
    const lightGray = '#aaaaaa';

    const drawRule = (y: number, opts?: { width?: number; dash?: number[] }) => {
      const w = opts?.width || pw;
      if (opts?.dash) doc.dash(opts.dash[0], { space: opts.dash[1] });
      doc.moveTo(ml, y).lineTo(ml + w, y).lineWidth(0.4).strokeColor('#000').stroke();
      if (opts?.dash) doc.undash();
    };

    // Title
    drawRule(80, { dash: [1, 3] });
    doc.y = 110;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(black)
      .text(tpl.name.toUpperCase(), ml, doc.y, { width: pw, align: 'center', lineGap: 3 });
    doc.moveDown(0.6);
    const ruleW = 50;
    drawRule(doc.y, { width: ruleW });
    doc.moveDown(0.6);
    doc.fontSize(8).font('Helvetica').fillColor(lightGray)
      .text('PLANTILLA', ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(2);
    drawRule(doc.y, { dash: [1, 3] });
    doc.moveDown(2);

    // Content
    const lines = tpl.content.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (doc.y > 750) { doc.addPage(); doc.y = 70; }

      if (trimmed.match(/^CONTRATO|^ACUERDO/) || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/)) {
        doc.moveDown(0.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'center', lineGap: 2 });
        doc.moveDown(0.8);
      } else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULAS?):/i)) {
        doc.moveDown(0.6);
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, lineGap: 1 });
        doc.moveDown(0.3);
      } else if (trimmed.match(/^(CONSIDERANDO|PARTE )/i)) {
        doc.moveDown(0.4);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw });
        doc.moveDown(0.2);
      } else if (trimmed.match(/^_{3,}/) || trimmed.match(/^─{3,}/)) {
        doc.moveDown(0.6);
      } else if (trimmed === '') {
        doc.moveDown(0.2);
      } else {
        doc.fontSize(9.5).font('Helvetica').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'justify', lineGap: 3 });
        doc.moveDown(0.3);
      }
    }

    doc.end();
  }

  @Put('templates/:id')
  @UseGuards(JwtAuthGuard)
  updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTemplateDto) { return this.templatesService.update(id, dto); }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard)
  deleteTemplate(@Param('id', ParseIntPipe) id: number) { return this.templatesService.remove(id); }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('search') search?: string) {
    const filters: any = {};
    if (req.user.role === 'admin_tenant') filters.tenantUserId = req.user.id;
    if (status) filters.status = status;
    if (search) filters.search = search;
    return this.contractsService.findAll(filters, Number(page) || 1, Math.min(Number(limit) || 50, 100));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) { return this.contractsService.findById(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateContractDto) {
    return this.contractsService.create({
      ...dto,
      tenantUserId: req.user.id,
      tenantName: req.user.name,
    });
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContractStatusDto) {
    return this.contractsService.updateStatus(id, dto.status);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async getPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const contract = await this.contractsService.findById(id);
    const doc = new PDFDocument({ margin: 70, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrato-${String(contract.id).padStart(6, '0')}.pdf"`);
    doc.pipe(res);

    const ml = 70;
    const pw = 455;
    const pageW = 595;
    const pageH = 842;
    const black = '#1a1a1a';
    const gray = '#666666';
    const lightGray = '#aaaaaa';

    const drawRule = (y: number, opts?: { width?: number; dash?: number[] }) => {
      const w = opts?.width || pw;
      if (opts?.dash) doc.dash(opts.dash[0], { space: opts.dash[1] });
      doc.moveTo(ml, y).lineTo(ml + w, y).lineWidth(0.4).strokeColor('#000').stroke();
      if (opts?.dash) doc.undash();
    };

    const drawFooter = (pg: number, total: number) => {
      doc.fontSize(7).font('Helvetica').fillColor(lightGray);
      doc.text(`— ${pg} —`, ml, pageH - 45, { width: pw, align: 'center' });
    };

    let pageCount = 1;

    // --- COVER / TITLE PAGE ---
    // Thin top rule
    drawRule(80, { dash: [1, 3] });

    // Title block
    doc.y = 110;
    doc.fontSize(22).font('Helvetica-Bold').fillColor(black)
      .text(contract.title.toUpperCase(), ml, doc.y, { width: pw, align: 'center', lineGap: 4 });
    doc.moveDown(0.8);

    // Thin decorative rule under title
    const ruleW = 60;
    drawRule(doc.y, { width: ruleW });
    doc.moveDown(0.8);

    // Contract number
    const contractNumber = `N.° ${String(contract.id).padStart(6, '0')}`;
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text(contractNumber, ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.3);

    // Date
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text(dateStr, ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(2);

    // Parties
    drawRule(doc.y);
    doc.moveDown(0.8);

    const partiesY = doc.y;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(gray)
      .text('ENTRE', ml, partiesY, { width: pw, align: 'center' });
    doc.moveDown(0.8);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(black)
      .text(contract.tenantName || `Usuario ID ${contract.tenantUserId}`, ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica').fillColor(gray)
      .text('(en adelante, "EL CONTRATANTE")', ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(1);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(gray)
      .text('Y', ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(black)
      .text(contract.freelancerName || `Usuario ID ${contract.freelancerUserId}`, ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica').fillColor(gray)
      .text('(en adelante, "EL CONTRATISTA")', ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(1.5);
    drawRule(doc.y);

    doc.moveDown(1.5);

    // Preamble
    doc.fontSize(9).font('Helvetica-Oblique').fillColor(gray)
      .text('En virtud del presente contrato, las partes acuerdan lo siguiente:', ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(2);
    drawRule(doc.y, { dash: [1, 3] });

    // --- CONTENT PAGES ---
    doc.addPage();
    pageCount = 2;
    drawFooter(pageCount, pageCount);

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const text = stripHtml(contract.content);
    const lines = text.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (doc.y > pageH - 100) {
        doc.addPage();
        pageCount++;
        drawFooter(pageCount, pageCount);
      }

      // Main title lines (CONTRATO..., ACUERDO...)
      if (trimmed.match(/^CONTRATO|^ACUERDO/) || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/)) {
        doc.moveDown(0.8);
        doc.fontSize(12).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'center', lineGap: 2 });
        doc.moveDown(0.8);
      }
      // Clause headers (PRIMERA, SEGUNDA...)
      else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULAS?):/i)) {
        doc.moveDown(0.6);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, lineGap: 1 });
        doc.moveDown(0.3);
      }
      // Sub-headings (CONSIDERANDO, PARTE...)
      else if (trimmed.match(/^(CONSIDERANDO|PARTE )/i)) {
        doc.moveDown(0.4);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw });
        doc.moveDown(0.2);
      }
      // Dashed lines
      else if (trimmed.match(/^_{3,}/) || trimmed.match(/^─{3,}/)) {
        doc.moveDown(0.6);
      }
      // Empty
      else if (trimmed === '') {
        doc.moveDown(0.2);
      }
      // Regular text
      else {
        doc.fontSize(10).font('Helvetica').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'justify', lineGap: 3 });
        doc.moveDown(0.3);
      }
    }

    // --- SIGNATURE PAGE ---
    if (doc.y > pageH - 200) {
      doc.addPage();
      pageCount++;
      drawFooter(pageCount, pageCount);
    }

    doc.moveDown(3);
    drawRule(doc.y);
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(black)
      .text('FIRMAS', ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(8).font('Helvetica-Oblique').fillColor(gray)
      .text('En señal de conformidad, las partes firman el presente contrato', ml, doc.y, { width: pw, align: 'center' });
    doc.text('en dos ejemplares del mismo tenor y a un solo efecto.', ml, doc.y + 2, { width: pw, align: 'center' });

    doc.moveDown(2.5);

    // Signature lines
    const sigW = 160;
    const gap = 50;
    const leftX = ml + (pw - sigW * 2 - gap) / 2;
    const rightX = leftX + sigW + gap;
    const sigY = doc.y;

    doc.moveTo(leftX, sigY).lineTo(leftX + sigW, sigY).lineWidth(0.8).strokeColor(black).stroke();
    doc.moveTo(rightX, sigY).lineTo(rightX + sigW, sigY).lineWidth(0.8).strokeColor(black).stroke();

    doc.moveDown(0.8);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(black)
      .text(contract.tenantName || 'EL CONTRATANTE', leftX, doc.y, { width: sigW, align: 'center' });
    doc.text(contract.freelancerName || 'EL CONTRATISTA', rightX, sigY + 22, { width: sigW, align: 'center' });

    doc.moveDown(0.4);
    doc.fontSize(7).font('Helvetica').fillColor(gray)
      .text('EL CONTRATANTE', leftX, doc.y, { width: sigW, align: 'center' });
    doc.text('EL CONTRATISTA', rightX, doc.y - 12, { width: sigW, align: 'center' });

    // Final rule
    doc.moveDown(3);
    drawRule(doc.y, { dash: [1, 3] });

    doc.end();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_tenant')
  remove(@Param('id', ParseIntPipe) id: number) { return this.contractsService.remove(id); }
}
