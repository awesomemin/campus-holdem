/*
  Warnings:

  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."TicketTransactionType" AS ENUM ('EARNED', 'SPENT');

-- CreateEnum
CREATE TYPE "public"."TicketSource" AS ENUM ('GAME_WIN', 'EVENT_REWARD', 'NEWCOMER_GIFT', 'ADMIN_GRANT', 'GAME_REGISTRATION', 'MANUAL_ADJUSTMENT');

-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "ticketBalance" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."Ticket";

-- CreateTable
CREATE TABLE "public"."TicketTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."TicketTransactionType" NOT NULL,
    "source" "public"."TicketSource" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "gameId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TicketTransaction" ADD CONSTRAINT "TicketTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
