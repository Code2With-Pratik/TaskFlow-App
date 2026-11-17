import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import {
  GitHubProjectController,
  GitHubTaskController,
  GitHubWebhookController,
} from './github.controller.js';
import { GitHubIntegrationService } from './github-integration.service.js';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({}),
    NotificationsModule,
    ProjectsModule,
  ],
  controllers: [
    GitHubProjectController,
    GitHubTaskController,
    GitHubWebhookController,
  ],
  providers: [GitHubIntegrationService],
})
export class GitHubModule {}
