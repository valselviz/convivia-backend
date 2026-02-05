/*
  Warnings:

  - Added the required column `gender` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'FEMALE';
UPDATE "Guest" SET "gender" = 'FEMALE' WHERE "gender" IS NULL;
