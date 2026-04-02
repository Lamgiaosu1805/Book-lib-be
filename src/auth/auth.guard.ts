import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;

    if (!authHeader) return false;

    const token = authHeader.split(' ')[1];

    if (!token) return false;

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
