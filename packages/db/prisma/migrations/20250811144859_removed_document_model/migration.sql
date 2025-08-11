/*
  Warnings:

  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentRevision` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShareToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentRevision" DROP CONSTRAINT "DocumentRevision_documentId_fkey";

-- DropForeignKey
ALTER TABLE "ShareToken" DROP CONSTRAINT "ShareToken_documentId_fkey";

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "DocumentRevision";

-- DropTable
DROP TABLE "ShareToken";
