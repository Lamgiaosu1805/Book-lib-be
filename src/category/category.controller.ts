import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @UseGuards(AdminGuard)
  @Post()
  async create(@Body('name') name: string, @Req() req: any) {
    const result = await this.categoryService.create(name);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Thêm danh mục', 'Danh mục', String(result._id), name,
    );
    return result;
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const cat = await this.categoryService.findById(id);
    const result = await this.categoryService.delete(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Xóa danh mục', 'Danh mục', id, cat?.name || id,
    );
    return result;
  }
}
