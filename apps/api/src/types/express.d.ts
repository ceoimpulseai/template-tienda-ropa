import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string;
      userEmail: string;
      businessId?: string;
      memberId?: string;
      role?: 'admin' | 'manager' | 'operator' | 'viewer';
      branchId?: string;
    };
  }
}
