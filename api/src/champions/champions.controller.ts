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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChampionsService } from './champions.service';

const UPLOAD_DIR = '/app/uploads/champions';

@Controller()
export class ChampionsController {
  constructor(private readonly championsService: ChampionsService) {}

  @Get('champions')
  findAll() {
    return this.championsService.findAll();
  }

  @Get('champions/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.championsService.findOne(id);
  }

  @Get('sessions/:sessionId/champion')
  findBySession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.championsService.findBySession(sessionId);
  }

  @Post('sessions/:sessionId/champion')
  create(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.championsService.create(sessionId);
  }

  @Post('champions/:id/photo')
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
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: any,
  ) {
    const photoUrl = `/uploads/champions/${file.filename}`;
    return this.championsService.uploadPhoto(id, photoUrl);
  }
}
