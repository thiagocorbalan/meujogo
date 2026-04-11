import {
  Controller,
  Get,
  Param,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { join, extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

const UPLOADS_ROOT = '/app/uploads';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Get('champions/:filename')
  serveChampionPhoto(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res,
  ) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = join(UPLOADS_ROOT, 'champions', safeName);
    const ext = extname(safeName).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.set({
      'Content-Type': contentType,
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    return new StreamableFile(createReadStream(filePath));
  }
}
