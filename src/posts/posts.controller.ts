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
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Prisma } from '@prisma/client';
import { create } from 'domain';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Request() req,
    @Body() createPostDto: { title: string; description?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Upload the image to Cloudinary
    const result = await this.cloudinaryService.uploadFile(file);

    return this.postsService.create(
      req.user.id,
      result.secure_url,
      createPostDto,
    );
  }

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const params: {
      skip?: number;
      take?: number;
      where?: Prisma.postsWhereInput;
      orderBy?: Prisma.postsOrderByWithRelationInput;
    } = {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      orderBy: { createdAt: 'desc' },
    };

    if (search) {
      params.where = {
        OR: [
          { title: { contains: search} },
          { description: { contains: search} },
        ],
      };
    }

    return this.postsService.findAll(params);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.postsService.findByUser(+userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-posts')
  getMyPosts(@Request() req) {
    return this.postsService.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: Prisma.postsUpdateInput,
    @Request() req,
  ) {
    return this.postsService.update(+id, req.user.id, updatePostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.remove(+id, req.user.id);
  }
}
