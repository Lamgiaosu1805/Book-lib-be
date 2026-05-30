import { Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class SuperAdminGuard extends AuthGuard {
  canActivate(context: any): boolean {
    const result = super.canActivate(context);
    if (!result) return false;
    const req = context.switchToHttp().getRequest();
    return req.user?.isSuperAdmin === true;
  }
}
