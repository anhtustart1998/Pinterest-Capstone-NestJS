import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { posts, Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    imageUrl: string,
    createPostDto: { title: string; description?: string },
  ): Promise<posts> {
    return this.prisma.posts.create({
      data: {
        userId,
        imageUrl,
        title: createPostDto.title,
        description: createPostDto.description,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.postsWhereInput;
    orderBy?: Prisma.postsOrderByWithRelationInput;
  }): Promise<posts[]> {
    const { skip, take, where, orderBy } = params;

    return this.prisma.posts.findMany({
      skip,
      take,
      where: {
        ...where,
        isDeleted: false,
        isActive: true,
      },
      orderBy,
      include: {
        users: {
          select: {
            id: true,
            fullname: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<posts> {
    const post = await this.prisma.posts.findUnique({
      where: { id, isDeleted: false },
      include: {
        users: {
          select: {
            id: true,
            fullname: true,
            email: true,
            avatar: true,
          },
        },
        comments: {
          where: { isDeleted: false },
          include: {
            users: {
              select: {
                id: true,
                fullname: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    return post;
  }

  async update(
    id: number,
    userId: number,
    updatePostDto: Prisma.postsUpdateInput,
  ): Promise<posts> {
    // Check if post exists and belong to the user

    const post = await this.prisma.posts.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${id} not found or you don't have permission`,
      );
    }

    return this.prisma.posts.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: number, userId: number): Promise<posts> {
    const post = await this.prisma.posts.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${id} not found or you don't have permission.`,
      );
    }

    return this.prisma.posts.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }

  async findByUser(userId: number): Promise<posts[]> {
    return this.prisma.posts.findMany({
      where: {
        userId,
        isDeleted: false,
        isActive: true,
      },
      include: {
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
}
