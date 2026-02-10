import type { Role } from "@/lib/roles";

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: Role;
      schoolId?: string;
      stateId?: string;
    };
  }
}
