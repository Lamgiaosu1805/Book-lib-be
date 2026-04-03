import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Query,
  UseGuards,
  Param,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { BookService } from './book.service';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.bookService.findAll(Number(page), Number(limit));
  }

  @Post('upload')
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const storagePath = process.env.FILE_STORAGE_PATH || './uploads';
          const fullPath = join(storagePath, 'full');

          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
          }
          cb(null, fullPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  upload(@UploadedFile() file, @Body() body) {
    return this.bookService.create(file.path, body.title, body.isFree);
  }

  // =======================================================
  // ✅ API TRẢ VỀ ẢNH DEMO (GỌI LOGIC TỪ SERVICE)
  // =======================================================
  @UseGuards(AuthGuard)
  @Get(':id/preview')
  @Header('Content-Type', 'application/pdf') // Ép trình duyệt hiểu đây là file PDF
  async getPreview(@Param('id') id: string): Promise<StreamableFile> {
    // Controller hoàn toàn sạch bóng logic tìm file, chỉ làm nhiệm vụ gọi Service
    return this.bookService.getPreviewStream(id);
  }
}
