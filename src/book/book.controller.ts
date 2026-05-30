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
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { BookService } from './book.service';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuditLogService } from 'src/audit-log/audit-log.service';

const fileStorage = diskStorage({
  destination: (req, file, cb) => {
    const fullPath = join(process.env.FILE_STORAGE_PATH || './uploads', 'full');
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
  },
});

@Controller('books')
export class BookController {
  constructor(
    private readonly bookService: BookService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.bookService.findAll(Number(page), Number(limit));
  }

  @Post('upload')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage }))
  async upload(@UploadedFile() file: any, @Body() body: any, @Req() req: any) {
    const book = await this.bookService.create(
      file.path, body.title, body.isFree, body.price,
      body.author, body.category, body.publishedYear, body.description,
    );
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Thêm sách mới', 'Sách', String(book._id), body.title,
    );
    return book;
  }

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

  @Get(':id')
  async getBookDetails(@Param('id') id: string) {
    return this.bookService.getBookDetails(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateBook(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const book = await this.bookService.update(id, body);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Sửa thông tin sách', 'Sách', id, book.title,
      `Cập nhật: ${Object.keys(body).join(', ')}`,
    );
    return book;
  }

  @UseGuards(AdminGuard)
  @Patch(':id/file')
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage }))
  async updateFile(@Param('id') id: string, @UploadedFile() file: any, @Req() req: any) {
    const book = await this.bookService.updateFile(id, file.path);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Tải lại file PDF', 'Sách', id, book.title,
    );
    return book;
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteBook(@Param('id') id: string, @Req() req: any) {
    const book = await this.bookService.getBookDetails(id);
    const result = await this.bookService.delete(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Xóa sách', 'Sách', id, book.title,
    );
    return result;
  }
}
