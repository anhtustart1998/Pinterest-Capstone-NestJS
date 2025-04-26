import { Injectable} from '@nestjs/common';
import { comments, Prisma} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor (private prisma: PrismaService) {}
  async findAll(
    param : {
      skip?: number,
      take?: number,
      where?: Prisma.commentsWhereInput,
      orderBy?: Prisma.commentsOrderByWithRelationInput
    }
  ) :Promise<comments[]> {
    const {skip, take, where, orderBy} = param;
    return this.prisma.comments.findMany({
      skip,
      take,
      where : {
        ...where,
        isDeleted: false
      },
      orderBy,
      include: {
        users: {
          select: {
            id: true,
            fullname: true,
            avatar: true
          }
        }
      }
    })
    
  }
  async create(
    userId: number, 
    createCommentDto: {postId: number, content: string}
  ) :Promise<comments> {
    return this.prisma.comments.create({
      data: {
        userId,
        postId: createCommentDto.postId,
        content: createCommentDto.content
      }
    })
  }
}
