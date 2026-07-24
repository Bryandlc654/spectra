"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../users/user.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_2 = require("../users/user.entity");
let AuthService = class AuthService {
    constructor(usersService, jwtService, usersRepository) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.usersRepository = usersRepository;
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            ...dto,
            password: hashedPassword,
            role: dto.role || user_entity_1.UserRole.FREELANCE,
        });
        return this.generateToken(user);
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Account is inactive');
        return this.generateToken(user);
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'Si el email existe, recibirás un enlace de recuperación' };
        }
        const resetToken = this.jwtService.sign({ sub: user.id, email: user.email, type: 'password_reset' }, { expiresIn: '1h' });
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
        return {
            message: 'Si el email existe, recibirás un enlace de recuperación',
            resetUrl,
            userName: user.name,
            userEmail: user.email,
        };
    }
    async resetPassword(token, newPassword) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== 'password_reset') {
                throw new common_1.BadRequestException('Token inválido');
            }
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new common_1.BadRequestException('Usuario no encontrado');
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this.usersService.updatePassword(user.id, hashedPassword);
            return { message: 'Contraseña actualizada correctamente' };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException('Token inválido o expirado');
        }
    }
    async acceptInvitation(token, newPassword) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== 'admin_invitation') {
                throw new common_1.BadRequestException('Token inválido');
            }
            const user = await this.usersService.findByEmail(payload.email);
            if (!user) {
                throw new common_1.BadRequestException('Usuario no encontrado');
            }
            if (!user.invitationToken) {
                throw new common_1.BadRequestException('Invitación ya fue aceptada');
            }
            if (user.invitationExpires && new Date(user.invitationExpires) < new Date()) {
                throw new common_1.BadRequestException('Invitación expirada');
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.invitationToken = null;
            user.invitationExpires = null;
            await this.usersRepository.save(user);
            return { message: 'Contraseña creada correctamente. Ya puedes iniciar sesión.' };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException('Token inválido o expirado');
        }
    }
    generateToken(user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_2.User)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map