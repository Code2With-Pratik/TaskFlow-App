export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_UPDATED"
  | "COMMENT_ADDED"
  | "COMMENT_MENTIONED"
  | "PROJECT_INVITATION"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "GITHUB_PULL_REQUEST_MERGED";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  designation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  role: ProjectRole;
  joinedAt: string;
  user: Pick<User, "id" | "name" | "email" | "avatar" | "designation">;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: Array<Pick<ProjectMember, "role">>;
  owner?: Pick<User, "id" | "name" | "email" | "avatar">;
  _count?: { tasks: number; members: number };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeIds: string[];
  createdById: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project: Pick<Project, "id" | "name">;
  assignees: Array<
    Pick<User, "id" | "name" | "email" | "avatar" | "designation">
  >;
  createdBy: Pick<User, "id" | "name" | "email" | "avatar">;
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  imageData?: string | null;
  mentions?: Array<{
    user: Pick<User, "id" | "name" | "email" | "designation">;
  }>;
  taskId: string;
  userId: string;
  createdAt: string;
  user: Pick<User, "id" | "name" | "email" | "avatar">;
}

export interface Activity {
  id: string;
  action: string;
  description: string;
  projectId: string;
  userId: string;
  createdAt: string;
  project?: Pick<Project, "id" | "name">;
  user: Pick<User, "id" | "name" | "avatar">;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  isRead: boolean;
  href: string | null;
  projectInvitation: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    project: Pick<Project, "id" | "name">;
    inviter: Pick<User, "name">;
  } | null;
  createdAt: string;
}

export interface ProjectInvitation {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
}

export interface GitHubRepository {
  id: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface GitHubProjectIntegration {
  configured: boolean;
  autoCompleteOnMerge: boolean;
  installation: {
    accountLogin: string;
    isActive: boolean;
    repositories: GitHubRepository[];
  } | null;
}

export interface GitHubAvailableRepository {
  githubRepoId: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface TaskGitHubLink {
  id: string;
  number: number;
  type: "ISSUE" | "PULL_REQUEST";
  url: string;
  title: string;
  state: string;
  isDraft: boolean;
  reviewState: string | null;
  mergedAt: string | null;
  syncedAt: string;
  repository: Pick<GitHubRepository, "fullName">;
}

export interface NotificationList {
  data: Notification[];
  unreadCount: number;
}

export interface DashboardSummary {
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
  };
  recentActivities: Activity[];
  upcomingDeadlines: Array<
    Pick<Task, "id" | "title" | "status" | "priority" | "dueDate"> & {
      project: Pick<Project, "id" | "name">;
    }
  >;
}

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}
