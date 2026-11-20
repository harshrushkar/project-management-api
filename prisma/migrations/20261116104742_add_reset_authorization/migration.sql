/*
  Warnings:

  - A unique constraint covering the columns `[resetAuthorizationHash]` on the table `PasswordReset` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PasswordReset" ADD COLUMN     "resetAuthorizationHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_resetAuthorizationHash_key" ON "PasswordReset"("resetAuthorizationHash");
