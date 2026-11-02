import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service.js';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const adminId: number | undefined = req.user?.id;
    const ip: string | undefined = req.ip;
    const action = `${req.method} ${req.path}`;

    return next.handle().pipe(
      tap(() => {
        if (adminId !== undefined) {
          this.auditService.log({
            adminId,
            action: action as never,
            ipAddress: ip,
          });
        }
      }),
    );
  }
}
