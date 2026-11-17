import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AddGitHubRepositoryDto } from './dto/add-github-repository.dto.js';
import { AddTaskGitHubLinkDto } from './dto/add-task-github-link.dto.js';
import { BrowseGitHubIssuesDto } from './dto/browse-github-issues.dto.js';
import { UpdateGitHubSettingsDto } from './dto/update-github-settings.dto.js';
import { GitHubIntegrationService } from './github-integration.service.js';

@ApiTags('GitHub integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/github')
export class GitHubProjectController {
  constructor(private readonly github: GitHubIntegrationService) {}

  @Get()
  getSettings(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.github.getProjectSettings(projectId, user.id);
  }

  @Post('install')
  createInstallUrl(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.github.createInstallUrl(projectId, user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.github.disconnect(projectId, user.id);
  }

  @Get('repositories/available')
  listAvailableRepositories(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.github.listAvailableRepositories(projectId, user.id);
  }

  @Get('issues')
  browseIssues(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BrowseGitHubIssuesDto,
  ) {
    return this.github.browseIssues(projectId, user.id, query);
  }

  @Post('issues/:repositoryId/:number/task')
  createTaskFromIssue(
    @Param('projectId') projectId: string,
    @Param('repositoryId') repositoryId: string,
    @Param('number', ParseIntPipe) number: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.github.createTaskFromIssue(
      projectId,
      user.id,
      repositoryId,
      number,
    );
  }

  @Post('repositories')
  addRepository(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddGitHubRepositoryDto,
  ) {
    return this.github.addRepository(projectId, user.id, dto);
  }

  @Patch('settings')
  updateSettings(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGitHubSettingsDto,
  ) {
    return this.github.updateProjectSettings(projectId, user.id, dto);
  }
}

@ApiTags('GitHub task links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/github-links')
export class GitHubTaskController {
  constructor(private readonly github: GitHubIntegrationService) {}

  @Get()
  findAll(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.github.findTaskLinks(taskId, user.id);
  }

  @Post()
  add(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddTaskGitHubLinkDto,
  ) {
    return this.github.addTaskLink(taskId, user.id, dto);
  }

  @Delete(':linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('taskId') taskId: string,
    @Param('linkId') linkId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.github.removeTaskLink(taskId, linkId, user.id);
  }
}

@ApiTags('GitHub webhooks')
@Controller('integrations/github')
export class GitHubWebhookController {
  constructor(private readonly github: GitHubIntegrationService) {}

  @Get('callback')
  async callback(
    @Query('state') state: string,
    @Query('installation_id') installationId: string | undefined,
    @Query('setup_action') setupAction: string | undefined,
    @Res() response: Response,
  ) {
    const redirectUrl = await this.github.completeInstallation(
      state,
      installationId,
      setupAction,
    );
    response.redirect(302, redirectUrl);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Req() request: Request) {
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody;
    return this.github.handleWebhook(
      request.header('x-hub-signature-256'),
      request.header('x-github-event'),
      rawBody,
      request.body,
    );
  }
}
