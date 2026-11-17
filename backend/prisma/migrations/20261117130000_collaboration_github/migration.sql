ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_MENTIONED';
ALTER TYPE "NotificationType" ADD VALUE 'GITHUB_PULL_REQUEST_MERGED';

CREATE TYPE "ProjectInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "GitHubWorkType" AS ENUM ('ISSUE', 'PULL_REQUEST');

ALTER TABLE "Project" ADD COLUMN "autoCompleteOnMerge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN "parentId" UUID;
ALTER TABLE "Notification" ADD COLUMN "href" TEXT;
ALTER TABLE "Notification" ADD COLUMN "projectInvitationId" UUID;

CREATE TABLE "ProjectInvitation" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "inviterId" UUID NOT NULL,
    "inviteeId" UUID NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "status" "ProjectInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommentMention" (
    "commentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentMention_pkey" PRIMARY KEY ("commentId", "userId")
);

CREATE TABLE "GitHubInstallation" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "installationId" INTEGER NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GitHubInstallation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GitHubRepository" (
    "id" UUID NOT NULL,
    "installationId" UUID NOT NULL,
    "githubRepoId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskGitHubLink" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "addedById" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "GitHubWorkType" NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "reviewState" TEXT,
    "mergedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskGitHubLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectInvitation_projectId_inviteeId_key" ON "ProjectInvitation"("projectId", "inviteeId");
CREATE INDEX "ProjectInvitation_inviteeId_status_idx" ON "ProjectInvitation"("inviteeId", "status");
CREATE INDEX "Comment_parentId_createdAt_idx" ON "Comment"("parentId", "createdAt");
CREATE INDEX "CommentMention_userId_createdAt_idx" ON "CommentMention"("userId", "createdAt");
CREATE UNIQUE INDEX "GitHubInstallation_projectId_key" ON "GitHubInstallation"("projectId");
CREATE INDEX "GitHubInstallation_installationId_idx" ON "GitHubInstallation"("installationId");
CREATE UNIQUE INDEX "GitHubRepository_installationId_githubRepoId_key" ON "GitHubRepository"("installationId", "githubRepoId");
CREATE UNIQUE INDEX "GitHubRepository_installationId_fullName_key" ON "GitHubRepository"("installationId", "fullName");
CREATE UNIQUE INDEX "TaskGitHubLink_repositoryId_number_type_key" ON "TaskGitHubLink"("repositoryId", "number", "type");
CREATE INDEX "TaskGitHubLink_taskId_syncedAt_idx" ON "TaskGitHubLink"("taskId", "syncedAt");
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviterId_fkey"
FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviteeId_fkey"
FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_commentId_fkey"
FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GitHubInstallation" ADD CONSTRAINT "GitHubInstallation_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GitHubInstallation" ADD CONSTRAINT "GitHubInstallation_connectedById_fkey"
FOREIGN KEY ("connectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GitHubRepository" ADD CONSTRAINT "GitHubRepository_installationId_fkey"
FOREIGN KEY ("installationId") REFERENCES "GitHubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskGitHubLink" ADD CONSTRAINT "TaskGitHubLink_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskGitHubLink" ADD CONSTRAINT "TaskGitHubLink_repositoryId_fkey"
FOREIGN KEY ("repositoryId") REFERENCES "GitHubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskGitHubLink" ADD CONSTRAINT "TaskGitHubLink_addedById_fkey"
FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectInvitationId_fkey"
FOREIGN KEY ("projectInvitationId") REFERENCES "ProjectInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
