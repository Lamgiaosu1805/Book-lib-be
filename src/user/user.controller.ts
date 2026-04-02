import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';

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
}
