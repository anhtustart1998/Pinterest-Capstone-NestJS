import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { SavesService } from './saves.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('saves')
export class SavesController {
  constructor(private readonly savesService: SavesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createSaveDto: { postId: number; boardId?: number },
    @Request() req,
  ) {
    return this.savesService.create(req.user.id, createSaveDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.savesService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('board/:boardId')
  findByBoard(@Param('boardId') boardId: string, @Request() req) {
    return this.savesService.findByBoard(req.user.id, +boardId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/move-to-board/:boardId')
  moveSaveToBoard(
    @Param('id') id: string,
    @Param('boardId') boardId: string,
    @Request() req,
  ) {
    return this.savesService.moveSaveToBoard(+id, req.user.id, +boardId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.savesService.remove(+id, req.user.id);
  }
}
