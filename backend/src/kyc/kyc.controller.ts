import {
  Controller, Get, Post, Put, Param, Body, Query, UseGuards, UseInterceptors,
  UploadedFile, ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { KycService } from './kyc.service';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const uploadDir = join(__dirname, '../../uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const ALLOWED_TYPES = ['identity', 'cv', 'tenant_document'];

@Controller('kyc')
export class KycController {
  constructor(private service: KycService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.service.findAll(Number(page) || 1, Math.min(Number(limit) || 50, 100), status);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  findOne(@Param('id') id: string) {
    return this.service.findById(+id);
  }

  @Post('upload/:userId/:userType')
  @UseGuards(JwtAuthGuard)
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
  async upload(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('userType') userType: string,
    @Body() body: { type?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const docType = body.type || 'identity';
    if (!ALLOWED_TYPES.includes(docType)) throw new BadRequestException(`Invalid document type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    if (!['admin_tenant', 'freelance'].includes(userType)) throw new BadRequestException('Invalid user type');
    const kyc = await this.service.create(userId, userType);
    await this.service.addDocument(kyc.id, docType, file);
    return { message: 'Document uploaded', kycId: kyc.id };
  }

  @Put('approve/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  approve(@Param('id') id: string) {
    return this.service.approve(+id);
  }

  @Put('reject/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  reject(@Param('id') id: string, @Body() dto: RejectKycDto) {
    return this.service.reject(+id, dto.adminNotes);
  }
}
