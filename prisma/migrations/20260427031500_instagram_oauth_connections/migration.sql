-- CreateEnum
CREATE TYPE "ExternalOAuthProvider" AS ENUM ('INSTAGRAM');

-- CreateEnum
CREATE TYPE "ExternalOAuthConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

-- CreateTable
CREATE TABLE "ExternalOAuthConnection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" "ExternalOAuthProvider" NOT NULL,
    "status" "ExternalOAuthConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "externalAccountId" TEXT,
    "scopes" TEXT,
    "tokenType" TEXT,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "error" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalOAuthConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalOAuthConnection_workspaceId_provider_key" ON "ExternalOAuthConnection"("workspaceId", "provider");

-- CreateIndex
CREATE INDEX "ExternalOAuthConnection_provider_status_idx" ON "ExternalOAuthConnection"("provider", "status");

-- CreateIndex
CREATE INDEX "ExternalOAuthConnection_workspaceId_status_idx" ON "ExternalOAuthConnection"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "ExternalOAuthConnection" ADD CONSTRAINT "ExternalOAuthConnection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
