-- CreateEnum
CREATE TYPE "public"."GameStatus" AS ENUM ('PLANNED', 'PROGRESS', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "public"."Game" ADD COLUMN     "status" "public"."GameStatus" NOT NULL DEFAULT 'PLANNED';
