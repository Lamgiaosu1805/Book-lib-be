import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { SuperAdminGuard } from 'src/auth/super-admin.guard';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('login')
  login(@Body() body: { identifier: string; password: string }) {
    return this.adminService.login(body.identifier, body.password);
  }

  @UseGuards(AdminGuard)
  @Post('create')
  createAdmin(
    @Body() body: { email: string; password: string; displayName: string; saintName: string },
  ) {
    return this.adminService.create(body.email, body.password, body.displayName, body.saintName);
  }

  @UseGuards(AdminGuard)
  @Get('list')
  listAdmins() {
    return this.adminService.findAll();
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const result = await this.adminService.softDelete(id, req.user.id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name || 'Admin' },
      'Đình chỉ admin', 'Quản trị viên', id,
    );
    return result;
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/restore')
  async restore(@Param('id') id: string, @Req() req: any) {
    const result = await this.adminService.restore(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name || 'Admin' },
      'Khôi phục admin', 'Quản trị viên', id,
    );
    return result;
  }

  @UseGuards(AdminGuard)
  @Get('logs')
  getLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.auditLogService.findAll(Number(page), Number(limit));
  }
}
