import { Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class AdminGuard extends AuthGuard {
  canActivate(context) {
    const result = super.canActivate(context);
    const req = context.switchToHttp().getRequest();

    if (!result) return false;

    return req.user.role === 'admin';
  }
}
