import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UseGuards } from '@nestjs/common';
import { BookService } from './book.service';
import { AdminGuard } from 'src/auth/admin.guard';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {} // 👈 INJECT

  @Post('upload')
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, process.env.FILE_STORAGE_PATH + '/full');
        },
        filename: (req, file, cb) => {
          cb(null, Date.now() + extname(file.originalname));
        },
      }),
    }),
  )
  upload(@UploadedFile() file, @Body() body) {
    return this.bookService.create(file.path, body.title, body.isFree);
  }
}
