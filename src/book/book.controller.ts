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
  Req,
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
          const fullPath = join(
            process.env.FILE_STORAGE_PATH || './uploads',
            'full',
          );
          if (!fs.existsSync(fullPath))
            fs.mkdirSync(fullPath, { recursive: true });
          cb(null, fullPath);
        },
        filename: (req, file, cb) => {
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  upload(@UploadedFile() file: any, @Body() body: any) {
    // ✅ Truyền ĐÚNG và ĐỦ 8 tham số cho Service
    return this.bookService.create(
      file.path,
      body.title,
      body.isFree,
      body.price,
      body.author,
      body.category,
      body.publishedYear,
      body.description,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id/preview')
  @Header('Content-Type', 'application/pdf')
  async getPreview(@Param('id') id: string) {
    return this.bookService.getPreviewStream(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/view')
  @Header('Content-Type', 'application/pdf')
  async viewBook(@Param('id') id: string, @Req() req: any) {
    return this.bookService.getFullBookStream(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getBookDetails(@Param('id') id: string) {
    return this.bookService.getBookDetails(id);
  }
}
