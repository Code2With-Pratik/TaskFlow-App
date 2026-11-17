import { ProjectRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectAccessService } from '../projects/project-access.service.js';
import { GitHubIntegrationService } from './github-integration.service.js';
import { parseGitHubWorkReferences } from './github-reference.js';

describe('GitHubIntegrationService', () => {
  it('finds task IDs and linked issue references in pull request text', () => {
    const references = parseGitHubWorkReferences(
      'Implement feature taskflow:01234567-89ab-4cde-8f01-234567890abc',
      'feature/ABC-123',
      'Closes #52 and fixes Code2With-Pratik/TaskFlow-App#17',
    );

    expect(references.taskIds).toEqual(
      new Set(['01234567-89ab-4cde-8f01-234567890abc']),
    );
    expect(references.closingIssueNumbers).toEqual(new Set([52, 17]));
  });

  it('does not auto-link unrelated issue mentions', () => {
    const references = parseGitHubWorkReferences(
      'Discusses #52 but does not close it',
    );

    expect(references.closingIssueNumbers).toEqual(new Set());
  });

  it('disconnects an active installation for project owners and admins', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const requireRoles = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      gitHubInstallation: { updateMany },
    } as unknown as PrismaService;
    const projectAccess = {
      requireRoles,
    } as unknown as ProjectAccessService;
    const service = new GitHubIntegrationService(
      prisma,
      projectAccess,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.disconnect('project-id', 'user-id');

    expect(requireRoles).toHaveBeenCalledWith('project-id', 'user-id', [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);
    expect(updateMany).toHaveBeenCalledWith({
      where: { projectId: 'project-id', isActive: true },
      data: { isActive: false },
    });
  });
});
