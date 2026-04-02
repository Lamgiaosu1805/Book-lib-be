import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const token = req.headers.authorization;

    if (!token) return false;

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return true;
    } catch {
      return false;
    }
  }
}
