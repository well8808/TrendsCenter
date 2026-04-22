ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
ALTER TYPE "WorkspaceRole" ADD VALUE IF NOT EXISTS 'MEMBER';

CREATE TYPE "AuthEmailKind" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'WORKSPACE_INVITE');
CREATE TYPE "AuthEmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SUPPRESSED');
CREATE TYPE "WorkspaceInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
CREATE TYPE "AuthEventType" AS ENUM (
  'SIGNUP_CREATED',
  'LOGIN_SUCCEEDED',
  'LOGIN_FAILED',
  'LOGIN_BLOCKED',
  'LOGOUT',
  'EMAIL_VERIFICATION_SENT',
  'EMAIL_VERIFIED',
  'EMAIL_VERIFICATION_FAILED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'PASSWORD_RESET_FAILED',
  'WORKSPACE_INVITE_SENT',
  'WORKSPACE_INVITE_ACCEPTED',
  'WORKSPACE_INVITE_FAILED',
  'MEMBER_ROLE_CHANGED',
  'RATE_LIMITED'
);

ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
UPDATE "User" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW()) WHERE "status" = 'ACTIVE';
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

UPDATE "WorkspaceMember" SET "role" = 'MEMBER' WHERE "role" IN ('ANALYST', 'VIEWER');
ALTER TABLE "WorkspaceMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "sendCount" INTEGER NOT NULL DEFAULT 1,
  "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceInvite" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
  "status" "WorkspaceInviteStatus" NOT NULL DEFAULT 'PENDING',
  "tokenHash" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "acceptedById" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthEmailOutbox" (
  "id" TEXT NOT NULL,
  "kind" "AuthEmailKind" NOT NULL,
  "status" "AuthEmailStatus" NOT NULL DEFAULT 'QUEUED',
  "toEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "actionUrl" TEXT,
  "workspaceId" TEXT,
  "userId" TEXT,
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthEmailOutbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthRateLimit" (
  "id" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthEvent" (
  "id" TEXT NOT NULL,
  "type" "AuthEventType" NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "emailHash" TEXT,
  "userId" TEXT,
  "actorUserId" TEXT,
  "workspaceId" TEXT,
  "ipHash" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_consumedAt_expiresAt_idx" ON "EmailVerificationToken"("userId", "consumedAt", "expiresAt");
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_consumedAt_expiresAt_idx" ON "PasswordResetToken"("userId", "consumedAt", "expiresAt");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

CREATE UNIQUE INDEX "WorkspaceInvite_tokenHash_key" ON "WorkspaceInvite"("tokenHash");
CREATE INDEX "WorkspaceInvite_workspaceId_status_expiresAt_idx" ON "WorkspaceInvite"("workspaceId", "status", "expiresAt");
CREATE INDEX "WorkspaceInvite_email_status_expiresAt_idx" ON "WorkspaceInvite"("email", "status", "expiresAt");

CREATE INDEX "AuthEmailOutbox_kind_status_createdAt_idx" ON "AuthEmailOutbox"("kind", "status", "createdAt");
CREATE INDEX "AuthEmailOutbox_toEmail_createdAt_idx" ON "AuthEmailOutbox"("toEmail", "createdAt");
CREATE INDEX "AuthEmailOutbox_workspaceId_createdAt_idx" ON "AuthEmailOutbox"("workspaceId", "createdAt");

CREATE UNIQUE INDEX "AuthRateLimit_bucket_key_key" ON "AuthRateLimit"("bucket", "key");
CREATE INDEX "AuthRateLimit_resetAt_idx" ON "AuthRateLimit"("resetAt");

CREATE INDEX "AuthEvent_type_createdAt_idx" ON "AuthEvent"("type", "createdAt");
CREATE INDEX "AuthEvent_emailHash_createdAt_idx" ON "AuthEvent"("emailHash", "createdAt");
CREATE INDEX "AuthEvent_workspaceId_type_createdAt_idx" ON "AuthEvent"("workspaceId", "type", "createdAt");
CREATE INDEX "AuthEvent_userId_createdAt_idx" ON "AuthEvent"("userId", "createdAt");

ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthEmailOutbox" ADD CONSTRAINT "AuthEmailOutbox_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
