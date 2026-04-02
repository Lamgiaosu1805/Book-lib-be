import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, body } = req;

    console.log('--- REQUEST ---');
    console.log('Method:', method);
    console.log('URL:', originalUrl);
    console.log('Body:', body);

    const start = Date.now();

    res.on('finish', () => {
      const time = Date.now() - start;

      console.log('--- RESPONSE ---');
      console.log('Status:', res.statusCode);
      console.log('Time:', time + 'ms');
      console.log('========================');
    });

    next();
  }
}
