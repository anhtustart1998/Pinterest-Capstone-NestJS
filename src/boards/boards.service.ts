import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { boards, Prisma } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    createBoardDto: { name: string; description?: string; isPrivate?: boolean },
  ): Promise<boards> {
    return this.prisma.boards.create({
      data: {
        userId,
        name: createBoardDto.name,
        description: createBoardDto.description,
        isPrivate: createBoardDto.isPrivate || false,
      },
    });
  }

  async findAll(params: {
    userId?: number;
    isPrivate?: boolean;
    skip?: number;
    take?: number;
    where?: Prisma.boardsWhereInput;
    orderBy?: Prisma.boardsOrderByWithRelationInput;
  }): Promise<boards[]> {
    const { userId, skip, take, where, orderBy, isPrivate } = params;

    // If userId is provided, get all boards for that user
    // If not, get all public boards
    const boardWhere: Prisma.boardsWhereInput = {
      ...where,
      isDeleted: false,
      isActive: true,
      ...(userId ? { userId } : { isPrivate: false }),
    };

    return this.prisma.boards.findMany({
      skip,
      take,
      where: boardWhere,
      orderBy,
      include: {
        users: {
          select: {
            id: true,
            fullname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findOne(id: number, userId?: number): Promise<boards> {
    const board = await this.prisma.boards.findFirst({
      where: {
        id,
        isDeleted: false,
        // If userId is provided, include private boards for that user, otherwise only include public boards
        ...(userId
          ? { OR: [{ userId }, { isPrivate: false }] }
          : { isPrivate: false }),
      },
      include: {
        users: {
          select: {
            id: true,
            fullname: true,
            avatar: true,
          },
        },
        saves: {
          where: { isDeleted: false },
          include: {
            posts: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(
        `Board with ID ${id} not found or is private`,
      );
    }

    return board;
  }

  async update(
    id: number,
    userId: number,
    updateBoardDto: Prisma.boardsUpdateInput,
  ): Promise<boards> {
    const board = await this.prisma.boards.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!board) {
      throw new NotFoundException(
        `Board with ID ${id} not found or you don't have permission`,
      );
    }
    return this.prisma.boards.update({
      where: { id },
      data: updateBoardDto,
    });
  }

  async remove(id: number, userId: number): Promise<boards> {
    const board = await this.prisma.boards.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!board) {
      throw new NotFoundException(
        `Board with ID ${id} not found or you don't have permission`,
      );
    }
    return this.prisma.boards.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }
}
