import { ProjectRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectAccessService } from '../projects/project-access.service.js';
import { GitHubIntegrationService } from './github-integration.service.js';

describe('GitHubIntegrationService', () => {
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
