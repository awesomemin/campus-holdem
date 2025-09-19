/*
  Warnings:

  - Changed the type of `time` on the `Game` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Game" DROP COLUMN "time",
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL;
