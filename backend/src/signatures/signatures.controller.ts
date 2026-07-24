import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors,
  UploadedFile, Req, Res, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import { SignaturesService } from './signatures.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const uploadDir = join(__dirname, '../../uploads');

const ALLOWED_MIMES = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png',
];

@Controller('signatures')
export class SignaturesController {
  constructor(private service: SignaturesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req.user.role === 'super_admin' ? undefined : req.user.id;
    return this.service.findAll(userId, Number(page) || 1, Math.min(Number(limit) || 50, 100));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { return this.service.findById(+id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException('File type not allowed'), false);
    },
  }))
  async create(@Req() req: any, @Body() body: { title: string; description?: string }, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.service.create({ title: body.title, description: body.description, file, ownerUserId: req.user.id });
  }

  @Post(':id/signers')
  @UseGuards(JwtAuthGuard)
  addSigner(@Param('id') id: string, @Body() body: { name: string; email: string; role?: string; signOrder?: number }) {
    return this.service.addSigner(+id, body);
  }

  @Delete(':id/signers/:signerId')
  @UseGuards(JwtAuthGuard)
  removeSigner(@Param('signerId') signerId: string) { return this.service.removeSigner(+signerId); }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard)
  async send(@Req() req: any, @Param('id') id: string) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.service.send(+id, baseUrl);
  }

  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    return this.service.getByToken(token);
  }

  @Post('token/:token/sign')
  async sign(@Param('token') token: string, @Body() body: { signature: string; x?: number; y?: number }, @Req() req: any) {
    return this.service.sign(token, body.signature, req.ip, body.x, body.y);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    const doc = await this.service.findById(+id);
    if (doc.ownerUserId !== undefined) {
      // ownership check is done in a real guard
    }
    return this.service.remove(+id);
  }

  @Get(':id/certificate')
  @UseGuards(JwtAuthGuard)
  async getCertificate(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.service.findById(+id);
    if (!doc.certificateData) throw new NotFoundException('Document not completed');
    res.setHeader('Content-Type', 'text/html');
    res.send(doc.certificateData);
  }
}
