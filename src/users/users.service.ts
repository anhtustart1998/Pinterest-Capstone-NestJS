import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { users, Prisma} from '@prisma/client';

import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number): Promise<users> {

    const user = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<users | null> {
    return this.prisma.users.findUnique({
      where: { email, isDeleted: false },
    });
  }

  async update(id: number, data: Prisma.usersUpdateInput): Promise<users> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password as string, 10);
    }

    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, deletedBy: number): Promise<users> {
    return this.prisma.users.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
    });
  }

  async getUserProfile(id: number): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        email: true,
        fullname: true,
        avatar: true,
        roles: {
          select: {
            name: true,
          },
        },
        boards: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            description: true,
            isPrivate: true,
            createdAt: true,
          },
        },
        posts: {
          where: { isDeleted: false, isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }
}
