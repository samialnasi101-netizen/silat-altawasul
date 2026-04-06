import { z } from 'zod';
import {
  MIN_PASSWORD_LENGTH,
  MIN_STAFF_ID_LENGTH,
  MIN_REASON_LENGTH,
  MAX_NOTE_LENGTH,
  DEFAULT_BRANCH_RADIUS_METERS,
} from './constants';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// --- Staff ---
export const staffCreateSchema = z.object({
  staffId: z.string().min(MIN_STAFF_ID_LENGTH, 'معرف الموظف يجب أن يكون حرفين على الأقل').trim(),
  password: z.string().min(MIN_PASSWORD_LENGTH, `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').trim(),
  branchId: z.string().optional().nullable(),
  workStart: z.string().regex(timeRegex, 'صيغة الوقت غير صحيحة (HH:mm)').optional().nullable(),
  workEnd: z.string().regex(timeRegex, 'صيغة الوقت غير صحيحة (HH:mm)').optional().nullable(),
});

export const staffUpdateSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').trim().optional(),
  branchId: z.string().optional().nullable(),
  workStart: z.string().regex(timeRegex, 'صيغة الوقت غير صحيحة (HH:mm)').optional().nullable(),
  workEnd: z.string().regex(timeRegex, 'صيغة الوقت غير صحيحة (HH:mm)').optional().nullable(),
  password: z.string().min(MIN_PASSWORD_LENGTH, `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`).optional(),
  active: z.boolean().optional(),
});

// --- Branch ---
export const branchCreateSchema = z.object({
  name: z.string().min(2, 'اسم الفرع يجب أن يكون حرفين على الأقل').trim(),
  location: z.string().trim().optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  radiusMeters: z.number().min(50).max(10000).default(DEFAULT_BRANCH_RADIUS_METERS).optional(),
});

export const branchUpdateSchema = z.object({
  name: z.string().min(2, 'اسم الفرع يجب أن يكون حرفين على الأقل').trim().optional(),
  location: z.string().trim().optional().nullable(),
  lat: z.union([z.number().min(-90).max(90), z.literal('').transform(() => null)]).optional().nullable(),
  lng: z.union([z.number().min(-180).max(180), z.literal('').transform(() => null)]).optional().nullable(),
  radiusMeters: z.number().min(50).max(10000).optional(),
});

// --- Charity ---
export const charityCreateSchema = z.object({
  name: z.string().min(2, 'اسم الجمعية يجب أن يكون حرفين على الأقل').trim(),
  description: z.string().trim().optional().nullable(),
});

export const charityUpdateSchema = z.object({
  name: z.string().min(2, 'اسم الجمعية يجب أن يكون حرفين على الأقل').trim().optional(),
  description: z.string().trim().optional().nullable(),
});

// --- Project ---
export const projectCreateSchema = z.object({
  name: z.string().min(2, 'اسم المشروع يجب أن يكون حرفين على الأقل').trim(),
  charityId: z.string().min(1, 'يجب اختيار جمعية'),
  branchIds: z.array(z.string()).optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(2, 'اسم المشروع يجب أن يكون حرفين على الأقل').trim().optional(),
  branchIds: z.array(z.string()).optional(),
});

// --- Donation ---
export const donationCreateSchema = z.object({
  projectId: z.string().min(1, 'يجب اختيار مشروع'),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر').max(999999999999.99, 'المبلغ كبير جداً'),
  note: z.string().max(MAX_NOTE_LENGTH, `الملاحظة يجب أن لا تتجاوز ${MAX_NOTE_LENGTH} حرف`).trim().optional().nullable(),
});

export const donationUpdateSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر').max(999999999999.99, 'المبلغ كبير جداً'),
  note: z.string().max(MAX_NOTE_LENGTH).trim().optional().nullable(),
});

// --- Attendance ---
export const checkinSchema = z.object({
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  accuracy: z.number().min(0).optional().nullable(),
  lateReason: z.string().min(MIN_REASON_LENGTH, `سبب التأخر يجب أن يكون ${MIN_REASON_LENGTH} أحرف على الأقل`).trim().optional().nullable(),
});

export const checkoutSchema = z.object({
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  accuracy: z.number().min(0).optional().nullable(),
  earlyReason: z.string().min(MIN_REASON_LENGTH, `سبب الانصراف المبكر يجب أن يكون ${MIN_REASON_LENGTH} أحرف على الأقل`).trim().optional().nullable(),
});

// --- Auth ---
export const loginSchema = z.object({
  staffId: z.string().min(1, 'معرف الموظف مطلوب').trim(),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH, `كلمة المرور الجديدة يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`),
});

// --- Historical Report ---
export const historicalReportSchema = z.object({
  title: z.string().min(2, 'العنوان مطلوب').trim(),
  year: z.number().int().min(2000).max(2100),
  reportDate: z.string().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  fileName: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
});

// --- Helper to extract first error message from Zod result ---
export function getZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'بيانات غير صحيحة';
}
