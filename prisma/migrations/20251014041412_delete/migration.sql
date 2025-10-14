/*
  Warnings:

  - You are about to drop the `Authentication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Authentication" DROP CONSTRAINT "Authentication_user_id_fkey";

-- DropTable
DROP TABLE "public"."Authentication";
