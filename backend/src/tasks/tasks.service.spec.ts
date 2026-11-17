import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectAccessService } from '../projects/project-access.service.js';
import { TasksService } from './tasks.service.js';

describe('TasksService', () => {
  it('sends a blocked notification when a task is moved to Blocked', async () => {
    const notificationCreateMany = vi.fn().mockResolvedValue({ count: 2 });
    const existing = {
      id: 'task-id',
      projectId: 'project-id',
      status: 'TODO',
      title: 'Investigate the failure',
      assignees: [{ userId: 'assignee-id' }],
      createdById: 'creator-id',
    };
    const updatedTask = {
      ...existing,
      status: 'BLOCKED',
      project: { id: 'project-id', name: 'Project' },
      assignees: [
        {
          userId: 'assignee-id',
          user: {
            id: 'assignee-id',
            name: 'Assignee',
            email: 'assignee@example.com',
            avatar: null,
            designation: null,
          },
        },
      ],
      createdBy: {
        id: 'creator-id',
        name: 'Creator',
        email: 'creator@example.com',
        avatar: null,
      },
      _count: { comments: 0 },
    };
    const transaction = {
      task: { update: vi.fn().mockResolvedValue(updatedTask) },
      activity: { create: vi.fn().mockResolvedValue(undefined) },
      notification: { createMany: notificationCreateMany },
    };
    const prisma = {
      task: { findUnique: vi.fn().mockResolvedValue(existing) },
      $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    } as unknown as PrismaService;
    const projectAccess = {
      requireMembership: vi.fn().mockResolvedValue({ role: 'MEMBER' }),
    } as unknown as ProjectAccessService;
    const notificationsGateway = {
      emitNewNotification: vi.fn(),
    } as unknown as NotificationsGateway;
    const service = new TasksService(
      prisma,
      projectAccess,
      notificationsGateway,
    );

    await service.update('task-id', 'actor-id', { status: 'BLOCKED' });

    expect(notificationCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          title: 'Task blocked',
          type: 'TASK_BLOCKED',
          userId: 'assignee-id',
        }),
      ]),
    });
  });
});
