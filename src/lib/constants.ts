export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
