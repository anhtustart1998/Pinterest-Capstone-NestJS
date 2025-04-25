import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @Request() req,
    @Body() updateUserDto: Prisma.usersUpdateInput,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      // For public profile, only return public information

      const user = await this.usersService.findOne(+id);

      return {
        id: user.id,
        fullname: user.fullname,
        avatar: user.avatar,
      };
    } catch (error) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string, @Request() req) {
    // Check if the requesting user has admin role or is the user themselves - admin has id 1
    if (req.user.id === +id || req.user.roleId === 1) {
      return this.usersService.getUserProfile(+id);
    }

    throw new UnauthorizedException(
      'You are not authorized to view this profile',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMyProfile(@Request() req) {
    return this.usersService.remove(req.user.id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    // Only allow if admin (roleId 1) or the user themselves
    if (req.user.id === +id || req.user.roleId === 1) {
      return this.usersService.remove(+id, req.user.id);
    }

    throw new UnauthorizedException(
      'You do not have permission to delete this user',
    );
  }
}
