import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
  GitHubWorkType,
  NotificationType,
  Prisma,
  ProjectRole,
  TaskStatus,
} from '../generated/prisma/client.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectAccessService } from '../projects/project-access.service.js';
import type { AddGitHubRepositoryDto } from './dto/add-github-repository.dto.js';
import type { AddTaskGitHubLinkDto } from './dto/add-task-github-link.dto.js';
import type { BrowseGitHubIssuesDto } from './dto/browse-github-issues.dto.js';
import type { UpdateGitHubSettingsDto } from './dto/update-github-settings.dto.js';
import { parseGitHubWorkReferences } from './github-reference.js';

const GITHUB_API = 'https://api.github.com';

interface GitHubInstallationResponse {
  id: number;
  account: { login: string } | null;
}

interface GitHubRepositoryResponse {
  id: number;
  full_name: string;
  default_branch: string;
  private: boolean;
}

interface GitHubIssueResponse {
  number: number;
  html_url: string;
  title: string;
  body: string | null;
  state: string;
  updated_at: string;
  pull_request?: unknown;
}

interface GitHubIssueSearchResponse {
  total_count: number;
  items: GitHubIssueResponse[];
}

interface GitHubCheckSuiteResponse {
  total_count: number;
  check_suites: Array<{
    status: string;
    conclusion: string | null;
  }>;
}

interface GitHubWorkResponse {
  number: number;
  html_url: string;
  title: string;
  body?: string | null;
  state: string;
  head?: { ref: string };
  draft?: boolean;
  merged?: boolean;
  merged_at?: string | null;
}

interface GitHubReviewResponse {
  user: { id: number } | null;
  state: string;
}

interface GitHubInstallState {
  sub: string;
  projectId: string;
  purpose: 'github-install';
}

@Injectable()
export class GitHubIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('GITHUB_APP_ID') &&
        this.config.get<string>('GITHUB_APP_SLUG') &&
        this.config.get<string>('GITHUB_APP_PRIVATE_KEY') &&
        this.config.get<string>('GITHUB_APP_WEBHOOK_SECRET'),
    );
  }

  async getProjectSettings(projectId: string, userId: string) {
    await this.projectAccess.requireMembership(projectId, userId);
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        autoCompleteOnMerge: true,
        githubInstallation: {
          select: {
            accountLogin: true,
            isActive: true,
            repositories: {
              select: {
                id: true,
                fullName: true,
                defaultBranch: true,
                isPrivate: true,
              },
              orderBy: { fullName: 'asc' },
            },
          },
        },
      },
    });

    return {
      configured: this.isConfigured(),
      autoCompleteOnMerge: project.autoCompleteOnMerge,
      installation: project.githubInstallation,
    };
  }

  async createInstallUrl(projectId: string, userId: string) {
    await this.projectAccess.requireRoles(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);
    const { slug } = this.requireConfiguration();
    const state = await this.jwtService.signAsync(
      { sub: userId, projectId, purpose: 'github-install' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '10m',
      },
    );
    return {
      url: `https://github.com/apps/${encodeURIComponent(slug)}/installations/new?state=${encodeURIComponent(state)}`,
    };
  }

  async disconnect(projectId: string, userId: string): Promise<void> {
    await this.projectAccess.requireRoles(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);
    await this.prisma.gitHubInstallation.updateMany({
      where: { projectId, isActive: true },
      data: { isActive: false },
    });
  }

  async completeInstallation(
    state: string,
    installationIdValue: string | undefined,
    setupAction: string | undefined,
  ): Promise<string> {
    const frontendUrl = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .split(',')[0]
      .trim();
    let payload: GitHubInstallState;
    try {
      payload = await this.jwtService.verifyAsync<GitHubInstallState>(state, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new BadRequestException('GitHub installation state is invalid or expired');
    }
    if (
      payload.purpose !== 'github-install' ||
      typeof payload.sub !== 'string' ||
      typeof payload.projectId !== 'string'
    ) {
      throw new BadRequestException('GitHub installation state is invalid');
    }

    const redirect = new URL(`/projects/${payload.projectId}`, frontendUrl);
    if (setupAction === 'cancel') {
      redirect.searchParams.set('github', 'cancelled');
      return redirect.toString();
    }
    if (!installationIdValue || !/^\d+$/.test(installationIdValue)) {
      throw new BadRequestException('GitHub did not return a valid installation');
    }
    const installationId = Number(installationIdValue);
    if (!Number.isSafeInteger(installationId) || installationId < 1) {
      throw new BadRequestException('GitHub did not return a valid installation');
    }
    if (setupAction !== 'install' && setupAction !== 'update') {
      throw new BadRequestException('GitHub installation was not completed');
    }

    await this.projectAccess.requireRoles(payload.projectId, payload.sub, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);
    const details = await this.githubRequest<GitHubInstallationResponse>(
      `/app/installations/${installationId}`,
      { appAuthentication: true },
    );
    if (!details.account?.login) {
      throw new BadGatewayException('GitHub did not return an installation account');
    }
    await this.prisma.gitHubInstallation.upsert({
      where: { projectId: payload.projectId },
      create: {
        projectId: payload.projectId,
        installationId,
        accountLogin: details.account.login,
        connectedById: payload.sub,
      },
      update: {
        installationId,
        accountLogin: details.account.login,
        connectedById: payload.sub,
        isActive: true,
      },
    });

    redirect.searchParams.set('github', 'connected');
    return redirect.toString();
  }

  async listAvailableRepositories(projectId: string, userId: string) {
    await this.projectAccess.requireRoles(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);
    const installation = await this.getActiveInstallation(projectId);
    const token = await this.createInstallationToken(installation.installationId);
    const repositories = await this.listInstallationRepositories(token);

    const selected = new Set(
      (
        await this.prisma.gitHubRepository.findMany({
          where: { installationId: installation.id },
          select: { githubRepoId: true },
        })
      ).map(({ githubRepoId }) => githubRepoId),
    );
    return repositories
      .filter((repository) => !selected.has(String(repository.id)))
      .map((repository) => ({
        githubRepoId: String(repository.id),
        fullName: repository.full_name,
        defaultBranch: repository.default_branch,
        isPrivate: repository.private,
      }));
  }

  async browseIssues(
    projectId: string,
    userId: string,
    query: BrowseGitHubIssuesDto,
  ) {
    await this.projectAccess.requireMembership(projectId, userId);
    const repository = await this.prisma.gitHubRepository.findFirst({
      where: {
        id: query.repositoryId,
        installation: { projectId, isActive: true },
      },
      select: {
        id: true,
        fullName: true,
        installation: { select: { installationId: true } },
      },
    });
    if (!repository) {
      throw new NotFoundException('Connected GitHub repository was not found');
    }

    const [, repoName] = repository.fullName.split('/');
    const token = await this.createInstallationToken(
      repository.installation.installationId,
      repoName,
    );
    const terms = [
      `repo:${repository.fullName}`,
      'is:issue',
      'state:open',
      ...(query.search?.trim()
        ? [`"${query.search.trim().replaceAll('"', '').replaceAll('\\', '')}"`]
        : []),
    ];
    const response = await this.githubRequest<GitHubIssueSearchResponse>(
      `/search/issues?q=${encodeURIComponent(terms.join(' '))}&per_page=30&page=${query.page}`,
      { token },
    );
    const issues = response.items.filter(
      (issue) =>
        !issue.pull_request &&
        issue.html_url
          .toLowerCase()
          .startsWith(`https://github.com/${repository.fullName}/issues/`.toLowerCase()),
    );
    const linked = await this.prisma.taskGitHubLink.findMany({
      where: {
        repositoryId: repository.id,
        type: GitHubWorkType.ISSUE,
        number: { in: issues.map(({ number }) => number) },
      },
      select: {
        number: true,
        task: { select: { id: true, title: true } },
      },
    });
    const linkedByNumber = new Map(
      linked.map(({ number, task }) => [number, task]),
    );

    return {
      totalCount: response.total_count,
      page: query.page,
      issues: issues.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        url: issue.html_url,
        updatedAt: issue.updated_at,
        linkedTask: linkedByNumber.get(issue.number) ?? null,
      })),
    };
  }

  async createTaskFromIssue(
    projectId: string,
    userId: string,
    repositoryId: string,
    number: number,
  ) {
    if (!Number.isSafeInteger(number) || number < 1) {
      throw new BadRequestException('GitHub issue number is invalid');
    }
    await this.projectAccess.requireMembership(projectId, userId);
    const repository = await this.prisma.gitHubRepository.findFirst({
      where: {
        id: repositoryId,
        installation: { projectId, isActive: true },
      },
      select: {
        id: true,
        fullName: true,
        installation: { select: { installationId: true } },
      },
    });
    if (!repository) {
      throw new NotFoundException('Connected GitHub repository was not found');
    }
    const existing = await this.prisma.taskGitHubLink.findUnique({
      where: {
        repositoryId_number_type: {
          repositoryId,
          number,
          type: GitHubWorkType.ISSUE,
        },
      },
      select: { taskId: true, task: { select: { title: true } } },
    });
    if (existing) {
      throw new ConflictException(
        `This issue is already linked to task "${existing.task.title}"`,
      );
    }

    const [, repoName] = repository.fullName.split('/');
    const token = await this.createInstallationToken(
      repository.installation.installationId,
      repoName,
    );
    const [owner] = repository.fullName.split('/');
    const issue = await this.githubRequest<GitHubIssueResponse>(
      `/repos/${owner}/${repoName}/issues/${number}`,
      { token },
    );
    if (issue.pull_request) {
      throw new BadRequestException('Select a GitHub issue, not a pull request');
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const task = await transaction.task.create({
          data: {
            projectId,
            createdById: userId,
            title: issue.title.slice(0, 200),
            description: issue.body?.slice(0, 5000) ?? null,
            status: TaskStatus.TODO,
            priority: 'MEDIUM',
          },
          select: { id: true, title: true, projectId: true },
        });
        await transaction.taskGitHubLink.create({
          data: {
            taskId: task.id,
            repositoryId: repository.id,
            addedById: userId,
            number: issue.number,
            type: GitHubWorkType.ISSUE,
            url: issue.html_url,
            title: issue.title,
            state: issue.state.toUpperCase(),
          },
        });
        await transaction.activity.create({
          data: {
            action: 'task.created',
            description: `Created task "${task.title}" from GitHub issue #${number}`,
            projectId,
            userId,
          },
        });
        return task;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This GitHub issue has already been added to the project',
        );
      }
      throw error;
    }
  }

  async addRepository(
    projectId: string,
    userId: string,
    dto: AddGitHubRepositoryDto,
  ) {
    await this.projectAccess.requireRoles(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);
    const installation = await this.getActiveInstallation(projectId);
    const token = await this.createInstallationToken(installation.installationId);
    const repositories = await this.listInstallationRepositories(token);
    const repository = repositories.find(
      (item) => item.full_name.toLowerCase() === dto.fullName.trim().toLowerCase(),
    );
    if (!repository) {
      throw new NotFoundException(
        'That repository is not available to the project GitHub App installation',
      );
    }
    return this.prisma.gitHubRepository.upsert({
      where: {
        installationId_fullName: {
          installationId: installation.id,
          fullName: repository.full_name,
        },
      },
      create: {
        installationId: installation.id,
        githubRepoId: String(repository.id),
        fullName: repository.full_name,
        defaultBranch: repository.default_branch,
        isPrivate: repository.private,
      },
      update: {
        githubRepoId: String(repository.id),
        defaultBranch: repository.default_branch,
        isPrivate: repository.private,
      },
      select: {
        id: true,
        fullName: true,
        defaultBranch: true,
        isPrivate: true,
      },
    });
  }

  async updateProjectSettings(
    projectId: string,
    userId: string,
    dto: UpdateGitHubSettingsDto,
  ) {
    await this.projectAccess.requireRoles(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);
    return this.prisma.project.update({
      where: { id: projectId },
      data: { autoCompleteOnMerge: dto.autoCompleteOnMerge },
      select: { autoCompleteOnMerge: true },
    });
  }

  async findTaskLinks(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException('Task was not found');
    await this.projectAccess.requireMembership(task.projectId, userId);
    return this.prisma.taskGitHubLink.findMany({
      where: { taskId },
      include: { repository: { select: { fullName: true } } },
      orderBy: { syncedAt: 'desc' },
    });
  }

  async addTaskLink(
    taskId: string,
    userId: string,
    dto: AddTaskGitHubLinkDto,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
      },
    });
    if (!task) throw new NotFoundException('Task was not found');
    await this.projectAccess.requireMembership(task.projectId, userId);

    const parsedUrl = this.parseWorkUrl(dto.url);
    const installation = await this.getActiveInstallation(task.projectId);
    const repository = await this.prisma.gitHubRepository.findFirst({
      where: {
        installationId: installation.id,
        fullName: { equals: parsedUrl.fullName, mode: 'insensitive' },
      },
    });
    if (!repository) {
      throw new BadRequestException(
        'Connect this GitHub repository to the project before linking its issue or pull request',
      );
    }
    const existing = await this.prisma.taskGitHubLink.findUnique({
      where: {
        repositoryId_number_type: {
          repositoryId: repository.id,
          number: parsedUrl.number,
          type: parsedUrl.type,
        },
      },
      select: { id: true, taskId: true },
    });
    if (existing && existing.taskId !== taskId) {
      throw new ConflictException(
        'This GitHub issue or pull request is already linked to another task',
      );
    }

    const token = await this.createInstallationToken(
      installation.installationId,
      parsedUrl.repository,
    );
    const work = await this.githubRequest<GitHubWorkResponse>(
      `/repos/${parsedUrl.fullName}/${parsedUrl.endpoint}/${parsedUrl.number}`,
      { token },
    );
    const reviewState =
      parsedUrl.type === GitHubWorkType.PULL_REQUEST
        ? await this.getReviewState(token, parsedUrl.fullName, parsedUrl.number)
        : null;
    const normalizedUrl = new URL(work.html_url);
    normalizedUrl.search = '';
    normalizedUrl.hash = '';

    return this.prisma.taskGitHubLink.upsert({
      where: {
        repositoryId_number_type: {
          repositoryId: repository.id,
          number: parsedUrl.number,
          type: parsedUrl.type,
        },
      },
      create: {
        taskId,
        repositoryId: repository.id,
        addedById: userId,
        number: work.number,
        type: parsedUrl.type,
        url: normalizedUrl.toString(),
        title: work.title,
        state: work.merged ? 'MERGED' : work.state.toUpperCase(),
        isDraft: work.draft ?? false,
        reviewState,
        mergedAt: work.merged_at ? new Date(work.merged_at) : null,
      },
      update: {
        title: work.title,
        state: work.merged ? 'MERGED' : work.state.toUpperCase(),
        isDraft: work.draft ?? false,
        reviewState,
        mergedAt: work.merged_at ? new Date(work.merged_at) : null,
        syncedAt: new Date(),
      },
      include: { repository: { select: { fullName: true } } },
    });
  }

  async removeTaskLink(taskId: string, linkId: string, userId: string) {
    const link = await this.prisma.taskGitHubLink.findFirst({
      where: { id: linkId, taskId },
      select: {
        id: true,
        addedById: true,
        task: { select: { projectId: true } },
      },
    });
    if (!link) throw new NotFoundException('GitHub link was not found');
    const membership = await this.projectAccess.requireMembership(
      link.task.projectId,
      userId,
    );
    if (
      link.addedById !== userId &&
      membership.role !== ProjectRole.OWNER &&
      membership.role !== ProjectRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot remove this GitHub link');
    }
    await this.prisma.taskGitHubLink.delete({ where: { id: linkId } });
  }

  async handleWebhook(
    signature: string | undefined,
    event: string | undefined,
    rawBody: Buffer | undefined,
    body: unknown,
  ): Promise<void> {
    const { webhookSecret } = this.requireConfiguration();
    if (!signature || !rawBody || !this.isValidSignature(signature, rawBody, webhookSecret)) {
      throw new UnauthorizedException('GitHub webhook signature is invalid');
    }
    const payload = this.asRecord(body);
    if (!payload) throw new BadRequestException('GitHub webhook payload is invalid');

    if (event === 'installation' && payload.action === 'deleted') {
      const installation = this.asRecord(payload.installation);
      if (typeof installation?.id === 'number') {
        await this.prisma.gitHubInstallation.updateMany({
          where: { installationId: installation.id },
          data: { isActive: false },
        });
      }
      return;
    }

    const installation = this.asRecord(payload.installation);
    const repository = this.asRecord(payload.repository);
    if (
      typeof installation?.id !== 'number' ||
      typeof repository?.full_name !== 'string'
    ) {
      return;
    }
    const action = typeof payload.action === 'string' ? payload.action : '';
    if (event === 'pull_request' || event === 'pull_request_review') {
      const pullRequest = this.asRecord(payload.pull_request);
      if (typeof pullRequest?.number !== 'number') return;
      await this.syncPullRequest(
        installation.id,
        repository.full_name,
        pullRequest.number,
        event === 'pull_request' &&
          (action === 'opened' || action === 'reopened'),
      );
      if (event === 'pull_request' && action === 'review_requested') {
        await this.notifyPullRequestTasks(
          installation.id,
          repository.full_name,
          pullRequest.number,
          NotificationType.GITHUB_REVIEW_REQUESTED,
          'Review requested',
          `A review was requested for pull request #${pullRequest.number}.`,
        );
      }
      return;
    }

    if (event === 'check_suite' && action === 'completed') {
      const suite = this.asRecord(payload.check_suite);
      const pullRequests = Array.isArray(suite?.pull_requests)
        ? suite.pull_requests
        : [];
      for (const candidate of pullRequests) {
        const pullRequest = this.asRecord(candidate);
        if (typeof pullRequest?.number !== 'number') continue;
        await this.syncPullRequest(
          installation.id,
          repository.full_name,
          pullRequest.number,
        );
        await this.syncCheckSuite(
          installation.id,
          repository.full_name,
          pullRequest.number,
          typeof suite?.head_sha === 'string' ? suite.head_sha : null,
        );
      }
    }
  }

  private async syncPullRequest(
    installationId: number,
    fullName: string,
    number: number,
    startWork = false,
  ): Promise<void> {
    const repositories = await this.prisma.gitHubRepository.findMany({
      where: {
        fullName: { equals: fullName, mode: 'insensitive' },
        installation: { installationId, isActive: true },
      },
      select: {
        id: true,
        installation: { select: { projectId: true, installationId: true } },
      },
    });
    if (!repositories.length) return;

    const [owner, repo] = fullName.split('/');
    const token = await this.createInstallationToken(installationId, repo);
    const work = await this.githubRequest<GitHubWorkResponse>(
      `/repos/${owner}/${repo}/pulls/${number}`,
      { token },
    );
    const reviewState = await this.getReviewState(token, fullName, number);
    const mergedAt = work.merged_at ? new Date(work.merged_at) : null;

    await this.autoLinkPullRequest(
      repositories,
      fullName,
      work,
      reviewState,
      mergedAt,
    );

    const links = await this.prisma.taskGitHubLink.findMany({
      where: {
        number,
        type: GitHubWorkType.PULL_REQUEST,
        repository: {
          fullName: { equals: fullName, mode: 'insensitive' },
          installation: { installationId, isActive: true },
        },
      },
      include: {
        repository: { select: { fullName: true } },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
            createdById: true,
            project: { select: { name: true, autoCompleteOnMerge: true } },
            assignees: { select: { userId: true } },
          },
        },
      },
    });

    for (const link of links) {
      await this.prisma.taskGitHubLink.update({
        where: { id: link.id },
        data: {
          title: work.title,
          state: work.merged ? 'MERGED' : work.state.toUpperCase(),
          isDraft: work.draft ?? false,
          reviewState,
          mergedAt,
          syncedAt: new Date(),
        },
      });
      if (
        startWork &&
        link.task.status !== TaskStatus.IN_PROGRESS &&
        link.task.status !== TaskStatus.DONE
      ) {
        await this.updateTaskStatusFromGitHub(
          link.task.id,
          link.task.title,
          link.task.projectId,
          link.task.createdById,
          link.task.assignees.map(({ userId }) => userId),
          TaskStatus.IN_PROGRESS,
          `Moved "${link.task.title}" to In progress because GitHub pull request #${number} was opened`,
        );
      }
      if (!work.merged || !link.task.project.autoCompleteOnMerge) continue;

      const update = await this.prisma.$transaction(async (transaction) => {
        const result = await transaction.task.updateMany({
          where: { id: link.task.id, status: { not: TaskStatus.DONE } },
          data: { status: TaskStatus.DONE },
        });
        if (result.count === 0) return [];
        await transaction.activity.create({
          data: {
            action: 'task.completed_by_github',
            description: `Completed "${link.task.title}" after GitHub pull request #${number} was merged`,
            projectId: link.task.projectId,
            userId: link.addedById,
          },
        });
        const recipients = new Set([
          ...link.task.assignees.map(({ userId }) => userId),
          link.task.createdById,
        ]);
        await transaction.notification.createMany({
          data: Array.from(recipients, (userId) => ({
            title: 'Task completed from GitHub',
            message: `Pull request #${number} was merged; "${link.task.title}" moved to Done.`,
            type: 'GITHUB_PULL_REQUEST_MERGED' as const,
            userId,
            href: `/tasks/${link.task.id}`,
          })),
        });
        return Array.from(recipients);
      });
      for (const recipientId of update) {
        this.notificationsGateway.emitNewNotification(recipientId);
      }
    }
  }

  private async autoLinkPullRequest(
    repositories: Array<{
      id: string;
      installation: { projectId: string; installationId: number };
    }>,
    fullName: string,
    work: GitHubWorkResponse,
    reviewState: string,
    mergedAt: Date | null,
  ): Promise<void> {
    const repositoryIdByProject = new Map(
      repositories.map(({ id, installation }) => [installation.projectId, id]),
    );
    const { taskIds, closingIssueNumbers } = parseGitHubWorkReferences(
      work.title,
      work.head?.ref ?? '',
      work.body ?? '',
    );

    const candidates = new Map<string, { projectId: string; createdById: string }>();
    if (taskIds.size) {
      const tasks = await this.prisma.task.findMany({
        where: {
          id: { in: Array.from(taskIds) },
          projectId: { in: Array.from(repositoryIdByProject.keys()) },
        },
        select: { id: true, projectId: true, createdById: true },
      });
      for (const task of tasks) candidates.set(task.id, task);
    }
    if (closingIssueNumbers.size) {
      const issueLinks = await this.prisma.taskGitHubLink.findMany({
        where: {
          number: { in: Array.from(closingIssueNumbers) },
          type: GitHubWorkType.ISSUE,
          repository: {
            fullName: { equals: fullName, mode: 'insensitive' },
            installation: { installationId: repositories[0].installation.installationId, isActive: true },
          },
        },
        select: {
          task: { select: { id: true, projectId: true, createdById: true } },
        },
      });
      for (const { task } of issueLinks) {
        if (repositoryIdByProject.has(task.projectId)) {
          candidates.set(task.id, task);
        }
      }
    }

    for (const [taskId, task] of candidates) {
      const repositoryId = repositoryIdByProject.get(task.projectId);
      if (!repositoryId) continue;
      await this.prisma.taskGitHubLink.upsert({
        where: {
          repositoryId_number_type: {
            repositoryId,
            number: work.number,
            type: GitHubWorkType.PULL_REQUEST,
          },
        },
        create: {
          taskId,
          repositoryId,
          addedById: task.createdById,
          number: work.number,
          type: GitHubWorkType.PULL_REQUEST,
          url: work.html_url,
          title: work.title,
          state: work.merged ? 'MERGED' : work.state.toUpperCase(),
          isDraft: work.draft ?? false,
          reviewState,
          mergedAt,
        },
        update: {
          title: work.title,
          state: work.merged ? 'MERGED' : work.state.toUpperCase(),
          isDraft: work.draft ?? false,
          reviewState,
          mergedAt,
          syncedAt: new Date(),
        },
      });
    }
  }

  private async syncCheckSuite(
    installationId: number,
    fullName: string,
    pullRequestNumber: number,
    headSha: string | null,
  ): Promise<void> {
    if (!headSha) return;
    const [owner, repo] = fullName.split('/');
    const token = await this.createInstallationToken(installationId, repo);
    const response = await this.githubRequest<GitHubCheckSuiteResponse>(
      `/repos/${owner}/${repo}/commits/${encodeURIComponent(headSha)}/check-suites?per_page=100`,
      { token },
    );
    if (response.check_suites.length === 0) return;
    const failedConclusions = new Set([
      'failure',
      'timed_out',
      'cancelled',
      'action_required',
      'startup_failure',
    ]);
    const status = response.check_suites.some(
      (suite) =>
        suite.conclusion !== null &&
        failedConclusions.has(suite.conclusion.toLowerCase()),
    )
      ? 'FAILURE'
      : response.check_suites.some((suite) => suite.status !== 'completed')
        ? 'IN_PROGRESS'
        : response.check_suites.some((suite) => suite.conclusion === null)
          ? 'IN_PROGRESS'
          : 'SUCCESS';
    const links = await this.prisma.taskGitHubLink.findMany({
      where: {
        number: pullRequestNumber,
        type: GitHubWorkType.PULL_REQUEST,
        repository: {
          fullName: { equals: fullName, mode: 'insensitive' },
          installation: { installationId, isActive: true },
        },
      },
      select: { id: true, checkStatus: true, taskId: true },
    });
    if (!links.length) return;
    await this.prisma.taskGitHubLink.updateMany({
      where: { id: { in: links.map(({ id }) => id) } },
      data: { checkStatus: status },
    });
    if (status !== 'FAILURE') return;
    for (const link of links.filter(({ checkStatus }) => checkStatus !== status)) {
      await this.notifyTaskMembers(
        link.taskId,
        NotificationType.GITHUB_CHECK_FAILED,
        'GitHub checks failed',
        `Checks failed for pull request #${pullRequestNumber} in ${fullName}.`,
      );
    }
  }

  private async notifyPullRequestTasks(
    installationId: number,
    fullName: string,
    number: number,
    type: NotificationType,
    title: string,
    message: string,
  ): Promise<void> {
    const links = await this.prisma.taskGitHubLink.findMany({
      where: {
        number,
        type: GitHubWorkType.PULL_REQUEST,
        repository: {
          fullName: { equals: fullName, mode: 'insensitive' },
          installation: { installationId, isActive: true },
        },
      },
      select: { taskId: true },
    });
    for (const { taskId } of links) {
      await this.notifyTaskMembers(taskId, type, title, message);
    }
  }

  private async notifyTaskMembers(
    taskId: string,
    type: NotificationType,
    title: string,
    message: string,
  ): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        createdById: true,
        assignees: { select: { userId: true } },
      },
    });
    if (!task) return;
    const recipients = new Set([
      task.createdById,
      ...task.assignees.map(({ userId }) => userId),
    ]);
    await this.prisma.notification.createMany({
      data: Array.from(recipients, (userId) => ({
        title,
        message,
        type,
        userId,
        href: `/tasks/${task.id}`,
      })),
    });
    for (const recipientId of recipients) {
      this.notificationsGateway.emitNewNotification(recipientId);
    }
  }

  private async updateTaskStatusFromGitHub(
    taskId: string,
    title: string,
    projectId: string,
    actorId: string,
    assigneeIds: string[],
    status: TaskStatus,
    description: string,
  ): Promise<void> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const update = await transaction.task.updateMany({
        where: {
          id: taskId,
          status: { notIn: [TaskStatus.IN_PROGRESS, TaskStatus.DONE] },
        },
        data: { status },
      });
      if (!update.count) return [];
      await transaction.activity.create({
        data: { action: 'task.status_updated', description, projectId, userId: actorId },
      });
      const recipients = new Set([actorId, ...assigneeIds]);
      await transaction.notification.createMany({
        data: Array.from(recipients, (userId) => ({
          title: 'Task moved to In progress',
          message: `"${title}" moved to In progress after a pull request was opened.`,
          type: NotificationType.TASK_STATUS_UPDATED,
          userId,
          href: `/tasks/${taskId}`,
        })),
      });
      return Array.from(recipients);
    });
    for (const recipientId of result) {
      this.notificationsGateway.emitNewNotification(recipientId);
    }
  }

  private async getReviewState(
    token: string,
    fullName: string,
    number: number,
  ): Promise<string> {
    const [owner, repo] = fullName.split('/');
    const reviews: GitHubReviewResponse[] = [];
    for (let page = 1; ; page += 1) {
      const next = await this.githubRequest<GitHubReviewResponse[]>(
        `/repos/${owner}/${repo}/pulls/${number}/reviews?per_page=100&page=${page}`,
        { token },
      );
      reviews.push(...next);
      if (next.length < 100) break;
    }
    const latestByReviewer = new Map<number, string>();
    for (const review of reviews) {
      if (review.user) latestByReviewer.set(review.user.id, review.state.toUpperCase());
    }
    const states = Array.from(latestByReviewer.values());
    if (states.includes('CHANGES_REQUESTED')) return 'CHANGES_REQUESTED';
    if (states.includes('APPROVED')) return 'APPROVED';
    if (states.length === 0) return 'REVIEW_REQUIRED';
    return 'REVIEW_PENDING';
  }

  private async listInstallationRepositories(
    token: string,
  ): Promise<GitHubRepositoryResponse[]> {
    const repositories: GitHubRepositoryResponse[] = [];
    for (let page = 1; ; page += 1) {
      const result = await this.githubRequest<{
        repositories: GitHubRepositoryResponse[];
      }>(`/installation/repositories?per_page=100&page=${page}`, { token });
      repositories.push(...result.repositories);
      if (result.repositories.length < 100) return repositories;
    }
  }

  private parseWorkUrl(value: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException('Enter a valid GitHub issue or pull request URL');
    }
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
      throw new BadRequestException('Only github.com issue and pull request URLs are supported');
    }
    const match =
      /^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/(issues|pull)\/([1-9]\d*)\/?$/.exec(
        url.pathname,
      );
    if (!match) {
      throw new BadRequestException(
        'Use a GitHub issue URL or pull request URL, such as https://github.com/owner/repo/pull/42',
      );
    }
    const number = Number(match[4]);
    if (!Number.isSafeInteger(number)) {
      throw new BadRequestException('The GitHub issue or pull request number is invalid');
    }
    return {
      fullName: `${match[1]}/${match[2]}`,
      repository: match[2],
      endpoint: match[3] === 'pull' ? 'pulls' : 'issues',
      number,
      type: match[3] === 'pull' ? GitHubWorkType.PULL_REQUEST : GitHubWorkType.ISSUE,
    };
  }

  private async getActiveInstallation(projectId: string) {
    const installation = await this.prisma.gitHubInstallation.findUnique({
      where: { projectId },
    });
    if (!installation || !installation.isActive) {
      throw new ServiceUnavailableException(
        'Install the TaskFlow GitHub App for this project before using GitHub integration',
      );
    }
    return installation;
  }

  private async createInstallationToken(
    installationId: number,
    repository?: string,
  ): Promise<string> {
    const result = await this.githubRequest<{ token: string }>(
      `/app/installations/${installationId}/access_tokens`,
      {
        appAuthentication: true,
        method: 'POST',
        ...(repository ? { body: { repositories: [repository] } } : {}),
      },
    );
    return result.token;
  }

  private async githubRequest<T>(
    path: string,
    options: {
      token?: string;
      appAuthentication?: boolean;
      method?: 'GET' | 'POST';
      body?: unknown;
    },
  ): Promise<T> {
    const { appId, privateKey } = this.requireConfiguration();
    const token = options.appAuthentication
      ? jwt.sign(
          {
            iat: Math.floor(Date.now() / 1000) - 30,
            exp: Math.floor(Date.now() / 1000) + 8 * 60,
            iss: appId,
          },
          privateKey,
          { algorithm: 'RS256' },
        )
      : options.token;
    if (!token) throw new ServiceUnavailableException('GitHub authentication is unavailable');

    const response = await fetch(`${GITHUB_API}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `${options.appAuthentication ? 'Bearer' : 'token'} ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'TaskFlow',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new BadGatewayException(
        `GitHub API request failed with status ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`,
      );
    }
    return (await response.json()) as T;
  }

  private requireConfiguration() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'GitHub integration is not configured on this server',
      );
    }
    const appId = this.config.getOrThrow<string>('GITHUB_APP_ID').trim();
    const slug = this.config.getOrThrow<string>('GITHUB_APP_SLUG').trim();
    const privateKey = this.config
      .getOrThrow<string>('GITHUB_APP_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
    const webhookSecret = this.config.getOrThrow<string>('GITHUB_APP_WEBHOOK_SECRET');
    return { appId, slug, privateKey, webhookSecret };
  }

  private isValidSignature(
    signature: string,
    rawBody: Buffer,
    secret: string,
  ): boolean {
    if (!/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
    const expected = createHmac('sha256', secret)
      .update(rawBody)
      .digest();
    const actual = Buffer.from(signature.slice('sha256='.length), 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : null;
  }
}
