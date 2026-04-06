-- Add reason columns to AttendanceRecord if they do not exist (سبب التأخير، سبب الانصراف المبكر)
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "checkInLateReason" TEXT;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "checkOutEarlyReason" TEXT;
