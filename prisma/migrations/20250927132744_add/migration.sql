/*
  Warnings:

  - You are about to drop the column `condition` on the `Product` table. All the data in the column will be lost.
  - Added the required column `status` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "condition",
ADD COLUMN     "status" TEXT NOT NULL;
