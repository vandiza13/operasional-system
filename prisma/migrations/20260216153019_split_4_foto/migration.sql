/*
  Warnings:

  - You are about to drop the column `evidenceUrl` on the `Reimbursement` table. All the data in the column will be lost.
  - Added the required column `receiptUrl` to the `Reimbursement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Reimbursement` DROP COLUMN `evidenceUrl`,
    ADD COLUMN `evidence1Url` TEXT NULL,
    ADD COLUMN `evidence2Url` TEXT NULL,
    ADD COLUMN `evidence3Url` TEXT NULL,
    ADD COLUMN `receiptUrl` TEXT NOT NULL;
