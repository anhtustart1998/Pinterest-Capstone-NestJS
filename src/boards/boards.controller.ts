import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    createBoardDto: { name: string; description?: string; isPrivate?: boolean },
    @Request() req,
  ) {
    return this.boardsService.create(req.user.id, createBoardDto);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.boardsService.findAll({
      userId: userId ? +userId : undefined,
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('my-boards')
  @UseGuards(JwtAuthGuard)
  findMyBoards(@Request() req) {
    return this.boardsService.findAll({
      userId: req.user.id,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.boardsService.findOne(+id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBoardDto: Prisma.boardsUpdateInput,
    @Request() req,
  ) {
    return this.boardsService.update(+id, req.user.id, updateBoardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.boardsService.remove(+id, req.user.id);
  }
}
