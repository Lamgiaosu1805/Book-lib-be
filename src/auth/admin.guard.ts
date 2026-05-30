import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class AdminGuard extends AuthGuard {
  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    const req = context.switchToHttp().getRequest();

    if (!result) return false;

    if (req.user.role !== 'admin') return false;

    if (req.user.mustChangePassword && req.path !== '/admin/change-password') {
      return false;
    }

    return true;
  }
}
