/*
  Warnings:

  - You are about to drop the column `insurance_number` on the `medical_profile` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_hospital` on the `medical_profile` table. All the data in the column will be lost.
  - You are about to drop the column `prescribing_doctor` on the `user_medications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "medical_profile" DROP COLUMN "insurance_number",
DROP COLUMN "preferred_hospital";

-- AlterTable
ALTER TABLE "user_medications" DROP COLUMN "prescribing_doctor";
