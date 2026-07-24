import {
  Controller, Get, Put, Post, Delete, Param, Body, Req, UseGuards, Query,
  UseInterceptors, UploadedFile, BadRequestException, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { FreelanceService } from './freelance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UpdateFreelanceProfileDto, UploadKycDocumentDto, ChangePasswordDto } from './dto';

const uploadDir = join(__dirname, '../../uploads');
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

@Controller('freelance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('freelance')
export class FreelanceController {
  constructor(private service: FreelanceService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.service.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Req() req: any, @Body() body: UpdateFreelanceProfileDto) {
    return this.service.updateProfile(req.user.id, body);
  }

  @Put('profile/password')
  changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    return this.service.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @Get('areas')
  getAreas() {
    return this.service.getAreas();
  }

  @Get('contracts')
  getContracts(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getContracts(req.user.id, Number(page) || 1, Math.min(Number(limit) || 50, 100), search);
  }

  @Get('contracts/:id')
  getContractById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.getContractById(req.user.id, id);
  }

  @Put('contracts/:id/sign')
  signContract(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.signContract(req.user.id, id);
  }

  @Get('kyc')
  getKycStatus(@Req() req: any) {
    return this.service.getKycStatus(req.user.id);
  }

  @Post('kyc/upload')
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
  async uploadKycDocument(
    @Req() req: any,
    @Body() body: UploadKycDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const docType = body.type || 'identity';
    return this.service.uploadKycDocument(req.user.id, docType, file);
  }

  @Delete('kyc/documents/:id')
  deleteKycDocument(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteKycDocument(req.user.id, id);
  }
}
