-- AlterTable: Allow Donation.userId to be NULL so that when an employee is deleted,
-- their donations remain but are unlinked (onDelete: SetNull).
ALTER TABLE "Donation" ALTER COLUMN "userId" DROP NOT NULL;
