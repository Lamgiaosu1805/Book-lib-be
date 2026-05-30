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

  @UseGuards(SuperAdminGuard)
  @Post('create')
  createAdmin(
    @Body() body: { displayName: string; saintName: string },
  ) {
    return this.adminService.create(body.displayName, body.saintName);
  }

  @UseGuards(AdminGuard)
  @Patch('change-password')
  changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.adminService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }

  @UseGuards(AdminGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.adminService.findMe(req.user.id);
  }

  @UseGuards(AdminGuard)
  @Get('list')
  listAdmins() {
    return this.adminService.findAll();
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Req() req: any) {
    const result = await this.adminService.resetPassword(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name || 'Admin' },
      'Reset mật khẩu admin', 'Quản trị viên', id,
    );
    return result;
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
