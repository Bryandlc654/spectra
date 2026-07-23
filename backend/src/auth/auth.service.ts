import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      role: dto.role || UserRole.FREELANCE,
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    return this.generateToken(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Si el email existe, recibirás un enlace de recuperación' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    return {
      message: 'Si el email existe, recibirás un enlace de recuperación',
      resetUrl,
      userName: user.name,
      userEmail: user.email,
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Token inválido');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.updatePassword(user.id, hashedPassword);

      return { message: 'Contraseña actualizada correctamente' };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Token inválido o expirado');
    }
  }

  async acceptInvitation(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'admin_invitation') {
        throw new BadRequestException('Token inválido');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      if (!user.invitationToken) {
        throw new BadRequestException('Invitación ya fue aceptada');
      }
      if (user.invitationExpires && new Date(user.invitationExpires) < new Date()) {
        throw new BadRequestException('Invitación expirada');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      (user as any).invitationToken = null;
      (user as any).invitationExpires = null;
      await this.usersRepository.save(user);

      return { message: 'Contraseña creada correctamente. Ya puedes iniciar sesión.' };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Token inválido o expirado');
    }
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    };
  }
}
