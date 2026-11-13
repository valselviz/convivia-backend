/*
  Warnings:

  - Made the column `shape` on table `Table` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "room_height_m" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "room_width_m" DOUBLE PRECISION NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "height" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN     "pos_x" DOUBLE PRECISION,
ADD COLUMN     "pos_y" DOUBLE PRECISION,
ADD COLUMN     "width" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ALTER COLUMN "shape" SET NOT NULL,
ALTER COLUMN "shape" SET DEFAULT 'redonda';
