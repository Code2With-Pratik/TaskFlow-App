import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectAccessService } from '../projects/project-access.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(taskId: string, userId: string, dto: CreateCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        title: true,
        assignees: { select: { userId: true } },
        createdById: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Task was not found');
    }

    await this.projectAccess.requireMembership(task.projectId, userId);
    const mentionedUserIds = dto.mentionedUserIds ?? [];
    const [members, parent] = await Promise.all([
      mentionedUserIds.length
        ? this.prisma.projectMember.findMany({
            where: {
              projectId: task.projectId,
              userId: { in: mentionedUserIds },
            },
            select: { userId: true },
          })
        : Promise.resolve([]),
      dto.parentId
        ? this.prisma.comment.findUnique({
            where: { id: dto.parentId },
            select: { id: true, taskId: true, parentId: true, userId: true },
          })
        : Promise.resolve(null),
    ]);
    if (members.length !== mentionedUserIds.length) {
      throw new BadRequestException(
        'Mentions must refer to members of this project',
      );
    }
    if (
      dto.parentId &&
      (!parent || parent.taskId !== taskId || parent.parentId !== null)
    ) {
      throw new BadRequestException(
        'Replies must reference a top-level comment on this task',
      );
    }

    const result = await this.prisma.$transaction(async (transaction) => {
      const comment = await transaction.comment.create({
        data: {
          taskId,
          userId,
          content: dto.content.trim(),
          imageData: dto.imageData ?? null,
          parentId: dto.parentId ?? null,
          mentions: {
            create: mentionedUserIds.map((mentionedUserId) => ({
              userId: mentionedUserId,
            })),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          mentions: {
            include: {
              user: {
                select: { id: true, name: true, email: true, designation: true },
              },
            },
          },
        },
      });

      await transaction.activity.create({
        data: {
          action: dto.parentId ? 'task.comment_replied' : 'task.comment_added',
          description: dto.parentId
            ? `Replied to a comment on "${task.title}"`
            : `Commented on task "${task.title}"`,
          projectId: task.projectId,
          userId,
        },
      });

      const recipients = new Map<string, 'COMMENT_ADDED' | 'COMMENT_MENTIONED'>();
      const commenters = new Set([
        ...task.assignees.map(({ userId: assigneeId }) => assigneeId),
        task.createdById,
        ...(parent ? [parent.userId] : []),
      ]);
      for (const recipientId of commenters) {
        if (recipientId !== userId) recipients.set(recipientId, 'COMMENT_ADDED');
      }
      for (const recipientId of mentionedUserIds) {
        if (recipientId !== userId) {
          recipients.set(recipientId, 'COMMENT_MENTIONED');
        }
      }
      if (recipients.size > 0) {
        await transaction.notification.createMany({
          data: Array.from(recipients, ([recipientId, type]) => ({
            title:
              type === 'COMMENT_MENTIONED'
                ? 'You were mentioned'
                : dto.parentId
                  ? 'New task reply'
                  : 'New task comment',
            message:
              type === 'COMMENT_MENTIONED'
                ? `${comment.user.name} mentioned you on "${task.title}".`
                : dto.parentId
                  ? `${comment.user.name} replied to a comment on "${task.title}".`
                  : `${comment.user.name} commented on "${task.title}".`,
            type,
            userId: recipientId,
            href: `/tasks/${taskId}#comment-${comment.id}`,
          })),
        });
      }

      return { comment, notifiedUserIds: Array.from(recipients.keys()) };
    });
    for (const recipientId of result.notifiedUserIds) {
      this.notificationsGateway.emitNewNotification(recipientId);
    }
    return result.comment;
  }

  async findAll(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) {
      throw new NotFoundException('Task was not found');
    }

    await this.projectAccess.requireMembership(task.projectId, userId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        mentions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, designation: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        content: true,
        task: { select: { projectId: true } },
      },
    });
    if (!comment) {
      throw new NotFoundException('Comment was not found');
    }

    const membership = await this.projectAccess.requireMembership(
      comment.task.projectId,
      userId,
    );
    if (
      comment.userId !== userId &&
      membership.role !== ProjectRole.OWNER &&
      membership.role !== ProjectRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.comment.delete({ where: { id } });
      await transaction.activity.create({
        data: {
          action: 'task.comment_removed',
          description: 'Removed a task comment',
          projectId: comment.task.projectId,
          userId,
        },
      });
    });
  }
}
