import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChampionsService } from './champions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

const UPLOAD_DIR = '/app/uploads/champions';

@Controller()
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class ChampionsController {
  constructor(private readonly championsService: ChampionsService) {}

  @Get('champions')
  findAll(@Req() req: any) {
    return this.championsService.findAll(req.groupContext.groupId);
  }

  @Get('champions/:id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.championsService.findOne(id, req.groupContext.groupId);
  }

  @Get('sessions/:sessionId/champion')
  findBySession(@Req() req: any, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.championsService.findBySession(sessionId, req.groupContext.groupId);
  }

  @Post('sessions/:sessionId/champion')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  create(@Req() req: any, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.championsService.create(sessionId, req.groupContext.groupId);
  }

  @Post('champions/:id/photo')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const championId = _req.params.id;
          const timestamp = Date.now();
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${championId}-${timestamp}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          cb(
            new BadRequestException(
              'Only image files (jpg, png, webp) are allowed',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadPhoto(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: any,
  ) {
    const photoUrl = `/uploads/champions/${file.filename}`;
    return this.championsService.uploadPhoto(id, photoUrl, req.groupContext.groupId);
  }
}
