import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  findAll(@Query('status') status: 'active' | 'deleted' = 'active') {
    return this.categoryService.findAll(status);
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
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const cat = await this.categoryService.findById(id);
    const result = await this.categoryService.softDelete(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Xóa mềm danh mục', 'Danh mục', id, cat?.name || id,
    );
    return result;
  }

  @UseGuards(AdminGuard)
  @Patch(':id/restore')
  async restore(@Param('id') id: string, @Req() req: any) {
    const result = await this.categoryService.restore(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Khôi phục danh mục', 'Danh mục', id, (result.data as any)?.name || id,
    );
    return result;
  }

  @UseGuards(AdminGuard)
  @Delete(':id/permanent')
  async hardDelete(@Param('id') id: string, @Req() req: any) {
    const cat = await this.categoryService.findById(id);
    const result = await this.categoryService.hardDelete(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Xóa vĩnh viễn danh mục', 'Danh mục', id, cat?.name || id,
    );
    return result;
  }
}
