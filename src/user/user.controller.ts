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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  deleteUser(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // ✅ API MỚI: Khôi phục người dùng
  @UseGuards(AdminGuard)
  @Patch('admin/:id/restore')
  restoreUser(@Param('id') id: string) {
    return this.userService.restore(id);
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
