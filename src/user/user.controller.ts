import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.userService.register(body.email, body.password);
  }

  @Post('login')
  login(@Body() body) {
    return this.userService.login(body.email, body.password);
  }

  @UseGuards(AdminGuard)
  @Get('admin/all')
  getAllUsers() {
    return this.userService.findAll();
  }

  @UseGuards(AdminGuard)
  @Delete('admin/:id')
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const user = await this.userService.findById(id);
    const result = await this.userService.remove(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Đình chỉ tài khoản', 'Người dùng', id, user?.email || id,
    );
    return result;
  }

  @UseGuards(AdminGuard)
  @Patch('admin/:id/restore')
  async restoreUser(@Param('id') id: string, @Req() req: any) {
    const user = await this.userService.findById(id);
    const result = await this.userService.restore(id);
    await this.auditLogService.log(
      { id: req.user.id, name: req.user.name },
      'Khôi phục tài khoản', 'Người dùng', id, user?.email || id,
    );
    return result;
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: { displayName: string }) {
    return this.userService.updateProfile(req.user.id, body.displayName);
  }

  @UseGuards(AuthGuard)
  @Patch('profile/password')
  changePassword(@Req() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.userService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }

  @UseGuards(AuthGuard)
  @Get('library')
  getMyLibrary(@Req() req: any) {
    return this.userService.getMyLibrary(req.user.id);
  }

  // ✅ Thêm vào tủ sách (Truyền ID sách vào URL)
  @UseGuards(AuthGuard)
  @Post('library/add/:bookId')
  addToLibrary(@Req() req: any, @Param('bookId') bookId: string) {
    return this.userService.addToLibrary(req.user.id, bookId);
  }
}
