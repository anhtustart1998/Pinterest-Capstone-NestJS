import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bycrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email, isDeleted: false },
    });
    if (user && (await bycrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.roleId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        avatar: user.avatar,
        roleId: user.roleId,
      },
    };
  }

  async register(userData: {
    email: string;
    password: string;
    fullname: string;
  }) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const userRole = await this.prisma.roles.findFirst({
      where: { name: 'user', isDeleted: false },
    });

    if (!userRole) {
      throw new UnauthorizedException('User role not found');
    }

    const hashedPassword = await bycrypt.hash(userData.password, 10);

    const newUser = await this.prisma.users.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        fullname: userData.fullname,
        roleId: userRole.id,
      },
    });

    const { password, ...result } = newUser;
    return result;
  }
}
