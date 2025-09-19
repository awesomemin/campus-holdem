/*
  Warnings:

  - You are about to drop the `TicketTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TicketTransaction" DROP CONSTRAINT "TicketTransaction_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Participant" ADD COLUMN     "ticketChange" INTEGER;

-- DropTable
DROP TABLE "public"."TicketTransaction";

-- DropEnum
DROP TYPE "public"."TicketSource";

-- DropEnum
DROP TYPE "public"."TicketTransactionType";
