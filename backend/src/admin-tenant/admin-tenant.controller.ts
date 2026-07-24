import {
  Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, Query,
  UseInterceptors, UploadedFile, BadRequestException, Res, ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AdminTenantService } from './admin-tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import {
  CreateFreelancerDto, UpdateFreelancerDto,
  CreateContractDto, UpdateContractDto, UpdateContractStatusDto,
  UpdateKycStatusDto, UploadKycDocumentDto, ALLOWED_DOC_TYPES,
  UpdateProfileDto, ChangePasswordDto,
} from './dto';

const uploadDir = join(__dirname, '../../uploads');
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

@Controller('admin-tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_tenant')
export class AdminTenantController {
  constructor(private service: AdminTenantService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user.id);
  }

  @Get('areas')
  getAreas() { return this.service.getAreas(); }

  @Get('templates')
  getTemplates(@Req() req: any) { return this.service.getTemplates(req.user.id); }

  @Post('templates')
  createTemplate(@Req() req: any, @Body() body: { name: string; content: string }) {
    return this.service.createTemplate(req.user.id, body);
  }

  @Put('templates/:id')
  updateTemplate(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; content?: string; isActive?: boolean }) {
    return this.service.updateTemplate(req.user.id, id, body);
  }

  @Delete('templates/:id')
  deleteTemplate(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteTemplate(req.user.id, id);
  }

  // ─── FREELANCERS ─────────────────────────────────────────

  @Get('freelancers')
  getFreelancers(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getFreelancers(req.user.id, Number(page) || 1, Math.min(Number(limit) || 50, 100), search);
  }

  @Get('freelancers/:id')
  getFreelancerById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.getFreelancerById(req.user.id, id);
  }

  // ─── CONTRACTS ───────────────────────────────────────────

  @Get('contracts')
  getContracts(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getContracts(req.user.id, Number(page) || 1, Math.min(Number(limit) || 50, 100), status, search);
  }

  @Get('contracts/:id')
  getContractById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.getContractById(req.user.id, id);
  }

  @Post('contracts')
  createContract(@Req() req: any, @Body() body: CreateContractDto) {
    return this.service.createContract(req.user.id, body);
  }

  @Put('contracts/:id/status')
  updateContractStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateContractStatusDto,
  ) {
    return this.service.updateContractStatus(req.user.id, id, body.status);
  }

  @Put('contracts/:id')
  updateContract(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateContractDto,
  ) {
    return this.service.updateContract(req.user.id, id, body);
  }

  @Delete('contracts/:id')
  deleteContract(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteContract(req.user.id, id);
  }

  @Post('contracts/:id/signature')
  initiateContractSignature(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.service.initiateContractSignature(req.user.id, id, baseUrl);
  }

  // ─── EXPORTS ──────────────────────────────────────────────

  @Get('export/freelancers/csv')
  async exportFreelancersCsv(@Req() req: any, @Res() res: Response, @Query('search') search?: string) {
    const result = await this.service.getFreelancers(req.user.id, 1, 10000, search);
    const rows = [
      ['ID', 'Código', 'Nombre', 'Email', 'País', 'Área', 'Experiencia', 'Skills', 'Fecha de creación'],
      ...result.data.map((u: any) => [
        u.id,
        u.code || '',
        u.name,
        u.email,
        u.country || '',
        u.area?.name || '',
        u.yearsOfExperience ? `${u.yearsOfExperience} años` : '',
        u.skills || '',
        new Date(u.createdAt).toLocaleDateString('es-ES'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="freelancers.csv"');
    res.send('\uFEFF' + csv);
  }

  @Get('export/contracts/csv')
  async exportContractsCsv(@Req() req: any, @Res() res: Response, @Query('status') status?: string, @Query('search') search?: string) {
    const result = await this.service.getContracts(req.user.id, 1, 10000, status, search);
    const rows = [
      ['ID', 'Título', 'Freelancer', 'Estado', 'Monto', 'Fecha inicio', 'Fecha fin', 'Primer pago', 'Frecuencia pago', 'Notas pago', 'Fecha creación'],
      ...result.data.map((c: any) => [
        c.id,
        c.title,
        c.freelancerName || '',
        c.status,
        c.amount ? `$${Number(c.amount).toFixed(2)}` : '',
        c.startDate || '',
        c.endDate || '',
        c.firstPaymentDate || '',
        c.paymentFrequency ? (c.paymentFrequency === 1 ? 'Mensual' : 'Quincenal') : '',
        c.paymentNotes || '',
        new Date(c.createdAt).toLocaleDateString('es-ES'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contratos.csv"');
    res.send('\uFEFF' + csv);
  }

  // ─── KYB (Know Your Business) ──────────────────────────────────

  @Get('kyb')
  getKyb(@Req() req: any) {
    return this.service.getKyb(req.user.id);
  }

  @Post('kyb/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException(`File type ${file.mimetype} not allowed. Allowed: ${ALLOWED_MIMES.join(', ')}`), false);
      },
    }),
  )
  async uploadKybDocument(
    @Req() req: any,
    @Body() body: { type: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const docType = body.type || 'business_registration';
    return this.service.uploadKybDocument(req.user.id, docType, file);
  }

  @Delete('kyb/documents/:id')
  deleteKybDocument(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteKybDocument(req.user.id, id);
  }

  // ─── PROFILE / SETTINGS ──────────────────────────────────

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.service.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.service.updateProfile(req.user.id, body);
  }

  @Put('profile/password')
  changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    return this.service.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
}
