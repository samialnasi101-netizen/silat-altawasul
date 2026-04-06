export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

// Attendance rules
export const LATE_THRESHOLD_MINUTES = 15;
export const EARLY_CHECKIN_BUFFER_MINUTES = 10;
export const POST_WORK_CHECKOUT_WINDOW_MINUTES = 15;
export const DEFAULT_WORK_START = '09:00';
export const DEFAULT_WORK_END = '17:00';

// Branch defaults
export const DEFAULT_BRANCH_RADIUS_METERS = 500;

// Validation
export const MIN_PASSWORD_LENGTH = 6;
export const MIN_REASON_LENGTH = 3;
export const MIN_STAFF_ID_LENGTH = 2;
export const MAX_NOTE_LENGTH = 500;

// Pagination
export const PAGINATION_DEFAULT_LIMIT = 50;
export const PAGINATION_MAX_LIMIT = 200;

// Reset system confirmation phrase
export const RESET_CONFIRM_PHRASE = 'اعادة تعيين النظام';
