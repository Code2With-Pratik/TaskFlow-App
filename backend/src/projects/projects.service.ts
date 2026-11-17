import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { ProjectRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import type { AddProjectMemberDto } from './dto/add-project-member.dto.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  create(ownerId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        ownerId,
        members: {
          create: { userId: ownerId, role: ProjectRole.OWNER },
        },
        activities: {
          create: {
            action: 'project.created',
            description: `Created project "${dto.name.trim()}"`,
            userId: ownerId,
          },
        },
      },
      include: { _count: { select: { tasks: true, members: true } } },
    });
  }

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { tasks: true, members: true } },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { tasks: true, members: true } },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    return this.prisma.$transaction(async (transaction) => {
      const project = await transaction.project.update({
        where: { id },
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.description === undefined
            ? {}
            : { description: dto.description?.trim() ?? null }),
        },
      });

      await transaction.activity.create({
        data: {
          action: 'project.updated',
          description: `Updated project "${project.name}"`,
          projectId: id,
          userId,
        },
      });

      return project;
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  async findMembers(projectId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { projectId },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designation: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships;
  }

  async addMember(
    projectId: string,
    actorId: string,
    dto: AddProjectMemberDto,
  ) {
    if (dto.role === ProjectRole.OWNER) {
      throw new BadRequestException('A project owner cannot be assigned as a member');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: { id: true, name: true, email: true, avatar: true },
    });
    if (!user) {
      throw new NotFoundException(
        'This person does not have a TaskFlow account yet. Invitations are available to existing users.',
      );
    }

    try {
      const invitation = await this.prisma.$transaction(async (transaction) => {
        const membership = await transaction.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: user.id } },
          select: { id: true },
        });
        if (membership) {
          throw new ConflictException('User is already a project member');
        }
        const project = await transaction.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { name: true },
        });
        const existing = await transaction.projectInvitation.findUnique({
          where: { projectId_inviteeId: { projectId, inviteeId: user.id } },
          select: { id: true, status: true },
        });
        if (existing?.status === 'PENDING') {
          throw new ConflictException('An invitation is already pending');
        }
        const invitation = existing
          ? await transaction.projectInvitation.update({
              where: { id: existing.id },
              data: {
                inviterId: actorId,
                status: 'PENDING',
                createdAt: new Date(),
                respondedAt: null,
              },
            })
          : await transaction.projectInvitation.create({
              data: { projectId, inviterId: actorId, inviteeId: user.id },
            });

        if (existing) {
          await transaction.notification.updateMany({
            where: { projectInvitationId: existing.id, userId: user.id },
            data: { isRead: true },
          });
        }
        await transaction.activity.create({
          data: {
            action: 'project.member_invited',
            description: `Invited ${user.email} to "${project.name}"`,
            projectId,
            userId: actorId,
          },
        });
        await transaction.notification.create({
          data: {
            title: 'Project invitation',
            message: `You were invited to join "${project.name}". Accept this invitation to get access.`,
            type: 'PROJECT_INVITATION',
            userId: user.id,
            href: `/projects/${projectId}`,
            projectInvitationId: invitation.id,
          },
        });

        return invitation;
      });
      this.notificationsGateway.emitNewNotification(user.id);
      return invitation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An invitation is already pending');
      }

      throw error;
    }
  }

  async respondToInvitation(
    invitationId: string,
    userId: string,
    accept: boolean,
  ) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      select: {
        id: true,
        projectId: true,
        inviteeId: true,
        inviterId: true,
        status: true,
        project: { select: { name: true } },
      },
    });
    if (!invitation || invitation.inviteeId !== userId) {
      throw new NotFoundException('Project invitation was not found');
    }
    if (invitation.status !== 'PENDING') {
      throw new ConflictException('This project invitation is no longer pending');
    }

    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.projectInvitation.updateMany({
        where: { id: invitationId, inviteeId: userId, status: 'PENDING' },
        data: {
          status: accept ? 'ACCEPTED' : 'DECLINED',
          respondedAt: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException('This project invitation is no longer pending');
      }
      if (accept) {
        await transaction.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId,
            role: ProjectRole.MEMBER,
          },
        });
      }
      await transaction.notification.updateMany({
        where: { projectInvitationId: invitationId, userId },
        data: { isRead: true },
      });
      if (accept) {
        await transaction.activity.create({
          data: {
            action: 'project.invitation_accepted',
            description: `Joined "${invitation.project.name}"`,
            projectId: invitation.projectId,
            userId,
          },
        });
      }
    });

    this.notificationsGateway.emitNewNotification(userId);
    if (accept) this.notificationsGateway.emitNewNotification(invitation.inviterId);
    return { projectId: invitation.projectId, accepted: accept };
  }

  async removeMember(
    projectId: string,
    actorId: string,
    userId: string,
  ): Promise<void> {
    const actorMembership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: actorId } },
      select: { role: true },
    });
    const targetMembership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true, user: { select: { email: true } } },
    });

    if (!actorMembership || !targetMembership) {
      throw new NotFoundException('Project member was not found');
    }
    if (
      actorId !== userId &&
      actorMembership.role !== ProjectRole.OWNER &&
      actorMembership.role !== ProjectRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot remove another project member');
    }
    if (
      actorMembership.role === ProjectRole.ADMIN &&
      actorId !== userId &&
      targetMembership.role !== ProjectRole.MEMBER
    ) {
      throw new ForbiddenException('Admins can only remove regular members');
    }
    if (targetMembership.role === ProjectRole.OWNER) {
      throw new BadRequestException('The project owner cannot be removed');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });
      await transaction.activity.create({
        data: {
          action: 'project.member_removed',
          description: `Removed ${targetMembership.user.email} from the project`,
          projectId,
          userId: actorId,
        },
      });
    });
  }

  async updateMemberRole(
    projectId: string,
    actorId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<void> {
    if (role === ProjectRole.OWNER) {
      throw new BadRequestException('Project ownership cannot be transferred this way');
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true, user: { select: { email: true } } },
    });
    if (!membership) {
      throw new NotFoundException('Project member was not found');
    }
    if (membership.role === ProjectRole.OWNER) {
      throw new BadRequestException('The project owner role cannot be changed');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.projectMember.update({
        where: { projectId_userId: { projectId, userId } },
        data: { role },
      });
      await transaction.activity.create({
        data: {
          action: 'project.member_role_updated',
          description: `Updated ${membership.user.email}'s project role to ${role}`,
          projectId,
          userId: actorId,
        },
      });
    });
  }
}
