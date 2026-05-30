import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body.email, body.password);
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

  @UseGuards(AdminGuard)
  @Get('logs')
  getLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.auditLogService.findAll(Number(page), Number(limit));
  }
}
