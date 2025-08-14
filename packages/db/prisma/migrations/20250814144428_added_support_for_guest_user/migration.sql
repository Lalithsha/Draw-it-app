-- DropForeignKey
ALTER TABLE "public"."Shape" DROP CONSTRAINT "Shape_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Room" ADD COLUMN     "isEphemeral" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Shape" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Shape" ADD CONSTRAINT "Shape_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
