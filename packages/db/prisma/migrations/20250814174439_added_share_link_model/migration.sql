-- CreateTable
CREATE TABLE "public"."ShareLink" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "passcodeHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "public"."ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_roomId_idx" ON "public"."ShareLink"("roomId");

-- AddForeignKey
ALTER TABLE "public"."ShareLink" ADD CONSTRAINT "ShareLink_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
