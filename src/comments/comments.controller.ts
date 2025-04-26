import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('postId') postId?: string
  ) {
    const param: {
      skip?: number,
      take?: number,
      where?: Prisma.commentsWhereInput,
      orderBy?: Prisma.commentsOrderByWithRelationInput
    } = {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      orderBy: {createdAt: 'desc'},
    }
    if(postId) {
      param.where = {
        postId: parseInt(postId)
      }
    }
    return this.commentsService.findAll(param);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req,
    @Body() createCommentDto: {postId: number, content: string}
  ) {
    return this.commentsService.create(
      req.user.id,
      createCommentDto);
  }

  
}
