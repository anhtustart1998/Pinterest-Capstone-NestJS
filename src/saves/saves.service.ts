import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { saves, Prisma } from '@prisma/client';

@Injectable()
export class SavesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    data: { postId: number; boardId?: number },
  ): Promise<saves> {
    const post = await this.prisma.posts.findUnique({
      where: { id: data.postId, isDeleted: false, isActive: true },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${data.postId} not found`);
    }

    // If boardId is provided, check of board exists and belongs to user
    if (data.boardId) {
      const board = await this.prisma.boards.findFirst({
        where: { id: data.boardId, userId, isDeleted: false },
      });

      if (!board) {
        throw new NotFoundException(
          `Board with ID ${data.boardId} not found or you don't have permission`,
        );
      }
    }
    // Check if post is already saved to this board (or shaved without a board)
    const existingSave = await this.prisma.saves.findFirst({
      where: {
        postId: data.postId,
        userId,
        boardId: data.boardId || null,
        isDeleted: false,
      },
    });

    if (existingSave) {
      throw new ConflictException(`Post is already saved.`);
    }

    return this.prisma.saves.create({
      data: {
        userId,
        postId: data.postId,
        boardId: data.boardId || null,
      },
      include: {
        posts: true,
        boards: true,
      },
    });
  }

  async findAll(userId: number): Promise<saves[]> {
    return this.prisma.saves.findMany({
      where: { userId, isDeleted: false },
      include: {
        posts: {
          include: {
            users: {
              select: {
                id: true,
                fullname: true,
                avatar: true,
              },
            },
          },
        },
        boards: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBoard(userId: number, boardId: number): Promise<saves[]> {
    // Check if board exists and belongs to user or is public
    const board = await this.prisma.boards.findFirst({
      where: {
        id: boardId,
        isDeleted: false,
        OR: [{ userId }, { isPrivate: false }],
      },
    });

    if (!board) {
      throw new NotFoundException(
        `Board with ID ${boardId} not found or you don't have permission`,
      );
    }
    return this.prisma.saves.findMany({
      where: { boardId, isDeleted: false },
      include: {
        posts: {
          include: {
            users: {
              select: {
                id: true,
                fullname: true,
                avatar: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            fullname: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number, userId: number): Promise<saves> {
    const save = await this.prisma.saves.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!save) {
      throw new NotFoundException(
        `Save with ID ${id} not found or you don't have permission`,
      );
    }

    return this.prisma.saves.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }

  async moveSaveToBoard(
    id: number,
    userId: number,
    boardId: number,
  ): Promise<saves> {
    // Check if save exists and belongs to user
    const save = await this.prisma.saves.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!save) {
      throw new NotFoundException(
        `Save with ID ${id} not found or you don't have permission`,
      );
    }

    const board = await this.prisma.boards.findFirst({
      where: { id: boardId, userId, isDeleted: false },
    });

    if (!board) {
      throw new NotFoundException(
        `Board with ID ${boardId} not found or you don't have permission`,
      );
    }

    return this.prisma.saves.update({
      where: { id },
      data: {
        boardId,
      },
      include: {
        posts: true,
        boards: true,
      },
    });
  }
}
