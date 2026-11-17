import { Injectable } from '@nestjs/common';
import { TaskStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const EMPTY_STATUS_COUNTS = {
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  blockedTasks: 0,
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map(({ projectId }) => projectId);

    if (projectIds.length === 0) {
      return {
        stats: {
          totalProjects: 0,
          ...EMPTY_STATUS_COUNTS,
          overdueTasks: 0,
        },
        recentActivities: [],
        upcomingDeadlines: [],
        developerWork: {
          myTasks: [],
          blockedTasks: [],
          reviewPullRequests: [],
          recentlyMerged: [],
        },
      };
    }

    const taskWhere = { projectId: { in: projectIds } };
    const statusCounts = await this.prisma.task.groupBy({
      by: ['status'],
      where: taskWhere,
      _count: { _all: true },
    });
    const counts = {
      ...EMPTY_STATUS_COUNTS,
      ...statusCounts.reduce(
        (totals, entry) => {
          totals.totalTasks += entry._count._all;
          if (entry.status === TaskStatus.DONE) {
            totals.completedTasks = entry._count._all;
          } else if (entry.status === TaskStatus.TODO) {
            totals.pendingTasks = entry._count._all;
          } else if (entry.status === TaskStatus.IN_PROGRESS) {
            totals.inProgressTasks = entry._count._all;
          } else if (entry.status === TaskStatus.BLOCKED) {
            totals.blockedTasks = entry._count._all;
          }
          return totals;
        },
        {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          blockedTasks: 0,
        },
      ),
    };

    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const overdueTasks = await this.prisma.task.count({
      where: {
        ...taskWhere,
        status: { not: TaskStatus.DONE },
        dueDate: { lt: now },
      },
    });
    const upcomingDeadlines = await this.prisma.task.findMany({
      where: {
        ...taskWhere,
        status: { not: TaskStatus.DONE },
        dueDate: { gte: now, lte: nextWeek },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 8,
    });
    const recentActivities = await this.prisma.activity.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [myTasks, blockedTasks, reviewLinks, mergedLinks] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          status: { not: TaskStatus.DONE },
          assignees: { some: { userId } },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
        take: 6,
      }),
      this.prisma.task.findMany({
        where: { ...taskWhere, status: TaskStatus.BLOCKED },
        select: {
          id: true,
          title: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      this.prisma.taskGitHubLink.findMany({
        where: {
          type: 'PULL_REQUEST',
          reviewState: { in: ['REVIEW_REQUIRED', 'REVIEW_PENDING'] },
          task: { projectId: { in: projectIds } },
        },
        select: {
          number: true,
          title: true,
          url: true,
          reviewState: true,
          repository: { select: { fullName: true } },
          task: {
            select: {
              id: true,
              title: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { syncedAt: 'desc' },
        take: 6,
      }),
      this.prisma.taskGitHubLink.findMany({
        where: {
          type: 'PULL_REQUEST',
          mergedAt: { gte: weekAgo },
          task: { projectId: { in: projectIds } },
        },
        select: {
          number: true,
          title: true,
          url: true,
          mergedAt: true,
          repository: { select: { fullName: true } },
          task: {
            select: {
              id: true,
              title: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { mergedAt: 'desc' },
        take: 6,
      }),
    ]);

    return {
      stats: {
        totalProjects: projectIds.length,
        ...counts,
        overdueTasks,
      },
      recentActivities,
      upcomingDeadlines,
      developerWork: {
        myTasks,
        blockedTasks,
        reviewPullRequests: reviewLinks.map((link) => ({
          taskId: link.task.id,
          taskTitle: link.task.title,
          projectId: link.task.project.id,
          projectName: link.task.project.name,
          repository: link.repository.fullName,
          number: link.number,
          title: link.title,
          url: link.url,
          reviewState: link.reviewState,
        })),
        recentlyMerged: mergedLinks.flatMap((link) =>
          link.mergedAt
            ? [{
                taskId: link.task.id,
                taskTitle: link.task.title,
                projectId: link.task.project.id,
                projectName: link.task.project.name,
                repository: link.repository.fullName,
                number: link.number,
                title: link.title,
                url: link.url,
                mergedAt: link.mergedAt,
              }]
            : [],
        ),
      },
    };
  }
}
