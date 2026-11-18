"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FolderKanban,
  ListTodo,
  Menu,
  Users,
  X,
} from "@/components/animated-icons";

const navigation = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "About", href: "/about" },
];

const productTabs = ["Projects", "Issues", "Pull requests", "GitHub", "Team"] as const;
type ProductTab = (typeof productTabs)[number];

const previewContent: Record<
  ProductTab,
  { eyebrow: string; title: string; rows: { title: string; detail: string; state: string }[]; metric: string; metricLabel: string }
> = {
  Projects: {
    eyebrow: "PROJECT OVERVIEW",
    title: "Website refresh",
    rows: [
      { title: "Build responsive navigation", detail: "Design system · Maya", state: "IN PROGRESS" },
      { title: "Polish task detail view", detail: "Web app · Alex", state: "TODO" },
      { title: "Review launch checklist", detail: "Release · Sam", state: "DONE" },
    ],
    metric: "68%",
    metricLabel: "tasks complete",
  },
  Issues: {
    eyebrow: "TASK TRACKER",
    title: "Open work",
    rows: [
      { title: "Improve empty state guidance", detail: "Medium · Maya", state: "IN PROGRESS" },
      { title: "Add keyboard focus styles", detail: "High · Alex", state: "TODO" },
      { title: "Fix narrow-screen overflow", detail: "Low · Sam", state: "DONE" },
    ],
    metric: "12",
    metricLabel: "tasks in this project",
  },
  "Pull requests": {
    eyebrow: "LINKED PULL REQUESTS",
    title: "Code review",
    rows: [
      { title: "feat: project activity feed", detail: "taskflow/web · #248", state: "IN REVIEW" },
      { title: "fix: board column layout", detail: "taskflow/web · #246", state: "OPEN" },
      { title: "chore: update dependencies", detail: "taskflow/api · #91", state: "MERGED" },
    ],
    metric: "3",
    metricLabel: "linked pull requests",
  },
  GitHub: {
    eyebrow: "OPTIONAL GITHUB INTEGRATION",
    title: "Connected repositories",
    rows: [
      { title: "taskflow/web", detail: "main · updated recently", state: "CONNECTED" },
      { title: "taskflow/api", detail: "main · NestJS", state: "CONNECTED" },
      { title: "taskflow/design-system", detail: "main · private", state: "CONNECTED" },
    ],
    metric: "3",
    metricLabel: "sample repositories",
  },
  Team: {
    eyebrow: "PROJECT MEMBERS",
    title: "Your collaborators",
    rows: [
      { title: "Maya Chen", detail: "Owner · Product", state: "ACTIVE" },
      { title: "Alex Rivera", detail: "Admin · Engineering", state: "ACTIVE" },
      { title: "Sam Patel", detail: "Member · Design", state: "ACTIVE" },
    ],
    metric: "3",
    metricLabel: "sample team members",
  },
};

const demoTasks = [
  { title: "Ship project overview", meta: "WEB · TF-024", state: "In progress", tone: "red" },
  { title: "Invite your teammates", meta: "WORKSPACE · TF-018", state: "To do", tone: "gray" },
  { title: "Link a pull request", meta: "GITHUB · TF-011", state: "Done", tone: "green" },
];

const bentoFeatures = [
  {
    id: "projects",
    eyebrow: "PROJECTS",
    title: "From idea to execution.",
    description: "Give every initiative a shared home for its people, tasks, and activity.",
    visual: "projects",
  },
  {
    id: "github",
    eyebrow: "GITHUB",
    title: "Code and coordination, connected.",
    description: "Bring repositories, issues, and pull requests alongside the tasks they relate to.",
    visual: "github",
  },
  {
    id: "tasks",
    eyebrow: "TASKS",
    title: "Know what needs attention.",
    description: "Assign owners, set priorities and due dates, and move work through clear statuses.",
    visual: "tasks",
  },
  {
    id: "team",
    eyebrow: "COLLABORATION",
    title: "Great work is shared work.",
    description: "Keep comments, mentions, invitations, and project updates close to the work.",
    visual: "team",
  },
];

function AvatarStack({ small = false }: { small?: boolean }) {
  return (
    <span className={`landing-avatars${small ? " landing-avatars-small" : ""}`} aria-label="Three sample teammates">
      <span>MC</span>
      <span>AR</span>
      <span>SP</span>
    </span>
  );
}

function DashboardPreview() {
  return (
    <div className="landing-dashboard-wrap" aria-label="Sample TaskFlow project dashboard preview">
      <div className="landing-dashboard">
        <div className="landing-dashboard-topbar">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[11px] font-semibold tracking-tight text-white">taskflow</span>
          </div>
          <span className="landing-demo-pill"><span /> SAMPLE WORKSPACE</span>
          <div className="flex items-center gap-3 text-white/45">
            <Bell size={14} aria-hidden="true" />
            <AvatarStack small />
          </div>
        </div>
        <div className="landing-dashboard-body">
          <aside className="landing-dashboard-sidebar">
            <p className="landing-preview-label">WORKSPACE</p>
            <div className="landing-side-link landing-side-link-active"><FolderKanban size={13} /> Projects</div>
            <div className="landing-side-link"><ListTodo size={13} /> My tasks</div>
            <div className="landing-side-link"><CircleDashed size={13} /> Activity</div>
            <p className="landing-preview-label mt-6">YOUR PROJECTS</p>
            <div className="landing-project-link"><span className="landing-project-dot" /> Website refresh</div>
            <div className="landing-project-link"><span className="landing-project-dot landing-project-dot-muted" /> Mobile app</div>
            <div className="landing-project-link"><span className="landing-project-dot landing-project-dot-dim" /> API v2</div>
            <div className="landing-github-note"><span className="landing-github-mark">⌘</span><span>GitHub connected</span><span className="landing-green-dot" /></div>
          </aside>
          <div className="landing-dashboard-main">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="landing-preview-label">YOUR WORKSPACE</p>
                <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-white sm:text-xl">A clear view of your work</h3>
                <p className="mt-1 text-[10px] text-white/40 sm:text-xs">Here’s what’s moving across your projects today.</p>
              </div>
              <span className="landing-preview-new-project">+ New project</span>
            </div>
            <div className="landing-preview-stats" aria-label="Sample workspace statistics">
              <div><span>Active projects</span><strong>4</strong><small>You’re a member of</small></div>
              <div><span>Total tasks</span><strong>24</strong><small>8 to do · 6 in progress</small></div>
              <div><span>Completed</span><strong>16</strong><small>Across your workspace</small></div>
              <div><span>Overdue</span><strong>2</strong><small>Need a little attention</small></div>
              <div><span>Blocked</span><strong>1</strong><small>Across your projects</small></div>
            </div>
            <div className="landing-dashboard-panels">
              {[
                { title: "My tasks", rows: ["Ship project overview", "Review API errors"], note: "2 tasks assigned" },
                { title: "Blocked work", rows: ["Resolve deployment config"], note: "1 needs attention" },
                { title: "Pull requests to review", rows: ["feat: project activity feed"], note: "taskflow/web · #248" },
                { title: "Recently merged", rows: ["fix: board column layout"], note: "taskflow/web · #246" },
              ].map((panel) => (
                <div className="landing-dashboard-panel" key={panel.title}>
                  <b>{panel.title}</b>
                  {panel.rows.map((row) => <span className="landing-dashboard-panel-task" key={row}>{row}</span>)}
                  <small>{panel.note}</small>
                </div>
              ))}
            </div>
            <div className="landing-dashboard-bottom">
              <div><b>Upcoming deadlines</b><span>Polish mobile board <small>Website refresh · Nov 21</small></span><span>Prepare release notes <small>Mobile app · Nov 24</small></span></div>
              <div><b>Recent activity</b><span><i>MC</i><small><strong>Maya</strong> updated a task · just now</small></span><span><i className="landing-mini-avatar-alt">AR</i><small><strong>Alex</strong> linked a pull request · 1h ago</small></span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="landing-float-card landing-float-progress">
        <span className="landing-float-icon"><CheckCircle2 size={15} /></span>
        <span><b>Nice momentum</b><small>Work is moving forward</small></span>
      </div>
      <div className="landing-float-card landing-float-notification">
        <span className="landing-float-icon landing-float-icon-red"><Bell size={14} /></span>
        <span><b>Task assigned</b><small>Review the new dashboard</small></span>
        <i />
      </div>
    </div>
  );
}

function ProductPreview({ activeTab }: { activeTab: ProductTab }) {
  const content = previewContent[activeTab];
  return (
    <div id="product-preview" className="landing-product-window" role="tabpanel" aria-label={`${activeTab} sample preview`}>
      <div className="landing-window-bar">
        <span /><span /><span />
        <span className="landing-window-path">taskflow / {activeTab.toLowerCase()}</span>
        <span className="landing-window-demo">DEMO DATA</span>
      </div>
      <div className="landing-product-content">
        <aside className="landing-product-rail">
          <BrandMark />
          <span className="landing-rail-active"><FolderKanban size={15} /></span>
          <span><ListTodo size={15} /></span>
          <span><Users size={15} /></span>
          <span><CircleDashed size={15} /></span>
        </aside>
        <div className="landing-product-main">
          <div className="flex items-start justify-between gap-4">
            <div><p className="landing-preview-label">{content.eyebrow}</p><h3 className="mt-1 text-lg font-semibold text-white">{content.title}</h3></div>
            <AvatarStack small />
          </div>
          <div className="landing-product-summary">
            <div className="landing-summary-number">{content.metric}</div>
            <div><span>{content.metricLabel}</span><div className="landing-mini-progress"><span /></div></div>
            <div className="landing-summary-caption"><span className="landing-green-dot" /> Updated just now</div>
          </div>
          <div className="landing-product-list">
            {content.rows.map((row) => (
              <div className="landing-product-row" key={row.title}>
                <span className={`landing-row-indicator ${row.state === "DONE" || row.state === "MERGED" || row.state === "CONNECTED" || row.state === "ACTIVE" ? "is-done" : row.state === "IN REVIEW" ? "is-review" : ""}`}>
                  {row.state === "DONE" || row.state === "MERGED" ? <CheckCircle2 size={14} /> : <span />}
                </span>
                <span className="min-w-0 flex-1"><b>{row.title}</b><small>{row.detail}</small></span>
                <span className={`landing-row-state ${row.state === "DONE" || row.state === "MERGED" || row.state === "CONNECTED" || row.state === "ACTIVE" ? "state-green" : ""}`}>{row.state}</span>
              </div>
            ))}
          </div>
        </div>
        <aside className="landing-product-aside">
          <div className="landing-aside-heading">Project activity</div>
          <div className="landing-aside-event"><span className="landing-aside-avatar">MC</span><span><b>Maya</b> updated a task<small>12 minutes ago</small></span></div>
          <div className="landing-aside-event"><span className="landing-aside-avatar avatar-alt">AR</span><span><b>Alex</b> added a comment<small>1 hour ago</small></span></div>
          <div className="landing-aside-event"><span className="landing-aside-avatar avatar-third">SP</span><span><b>Sam</b> joined the project<small>Yesterday</small></span></div>
          <div className="landing-aside-github"><span className="landing-green-dot" /> GitHub integration ready</div>
        </aside>
      </div>
    </div>
  );
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "projects") {
    return (
      <div className="landing-mini-projects">
        {[
          ["Website refresh", "68%", "red"],
          ["Mobile app", "42%", "gray"],
          ["API v2", "84%", "white"],
        ].map(([name, progress, tone]) => (
          <div className="landing-mini-project" key={name}>
            <span className={`landing-mini-project-icon icon-${tone}`}><FolderKanban size={13} /></span>
            <span className="flex-1"><b>{name}</b><span className="landing-mini-progress"><i style={{ width: progress }} /></span></span>
            <small>{progress}</small>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-between text-[10px] text-white/40"><span>Shared project space</span><AvatarStack small /></div>
      </div>
    );
  }
  if (type === "github") {
    return (
      <div className="landing-mini-repos">
        <div className="landing-repo-connect"><span className="landing-github-mark">⌘</span><span><b>GitHub App</b><small>Connected to your project</small></span><span className="landing-green-dot" /></div>
        {["taskflow/web", "taskflow/api"].map((repo, index) => (
          <div className="landing-repo-row" key={repo}><span className="landing-repo-icon">{index === 0 ? "◈" : "⌘"}</span><span><b>{repo}</b><small>{index === 0 ? "2 linked pull requests" : "1 linked issue"}</small></span><span className="landing-repo-arrow">↗</span></div>
        ))}
      </div>
    );
  }
  if (type === "tasks") {
    return (
      <div className="landing-mini-tasklist">
        {demoTasks.map((task) => (
          <div className="landing-mini-task" key={task.title}><span className={`landing-task-status landing-status-${task.tone}`} /><span><b>{task.title}</b><small>{task.meta}</small></span><i className={`task-${task.tone}`}>{task.state}</i></div>
        ))}
      </div>
    );
  }
  return (
    <div className="landing-mini-team">
      <div className="flex items-center justify-between"><span className="landing-preview-label">PROJECT MEMBERS</span><Users size={16} className="text-white/45" /></div>
      {[["MC", "Maya Chen", "Owner"], ["AR", "Alex Rivera", "Admin"], ["SP", "Sam Patel", "Member"]].map(([initials, name, role], index) => (
        <div className="landing-team-row" key={initials}><span className={`landing-aside-avatar ${index === 1 ? "avatar-alt" : index === 2 ? "avatar-third" : ""}`}>{initials}</span><b>{name}</b><small>{role}</small></div>
      ))}
    </div>
  );
}

function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <Link className="landing-wordmark" href="/" aria-label="TaskFlow home"><BrandMark className="landing-brand-mark" /><span>TaskFlow</span></Link>
        <nav className="landing-nav-links" aria-label="Main navigation">
          {navigation.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="landing-nav-actions">
          <Link className="landing-button landing-button-small landing-login-button" href="/login">Log in</Link>
          <Link className="landing-button landing-button-small" href="/register">Get started <ArrowRight size={14} /></Link>
        </div>
        <button className="landing-mobile-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && <nav className="landing-mobile-menu" aria-label="Mobile navigation">{navigation.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}<Link className="landing-button landing-login-button" href="/login" onClick={() => setMenuOpen(false)}>Log in</Link><Link className="landing-button" href="/register" onClick={() => setMenuOpen(false)}>Get started <ArrowRight size={15} /></Link></nav>}
    </header>
  );
}

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<ProductTab>("Projects");

  return (
    <div className="landing-page">
      <LandingNav />
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-announcement"><span /> THE DEVELOPER WORKSPACE, REIMAGINED</p>
            <h1 id="landing-title">Your development workflow.<br /><span>One focused workspace.</span></h1>
            <p className="landing-hero-description">Plan projects, collaborate with your team, and connect your GitHub workflow — all in one beautifully organized workspace.</p>
            <div className="landing-hero-actions">
              <Link className="landing-button" href="/register">Start building <ArrowRight size={16} /></Link>
              <a className="landing-secondary-button" href="#product">Explore the platform <span>↓</span></a>
            </div>
            <div className="landing-hero-note"><span className="landing-green-dot" /> A clear home for the work you care about.</div>
          </div>
          <DashboardPreview />
        </section>

        <section className="landing-trust" aria-label="TaskFlow capabilities">
          <p>Everything your development team needs. Connected.</p>
          <div className="landing-trust-items">
            <span><FolderKanban size={15} /> Project management</span>
            <span><CheckCircle2 size={15} /> Issue tracking</span>
            <span><CircleDashed size={15} /> GitHub integration</span>
            <span><Users size={15} /> Team collaboration</span>
            <span><CalendarClock size={15} /> Progress & deadlines</span>
          </div>
        </section>

        <section id="features" className="landing-section landing-features" aria-labelledby="features-title">
          <div className="landing-section-heading">
            <p className="landing-kicker">A BETTER WAY TO SHIP</p>
            <h2 id="features-title">Less busywork. <span>More building.</span></h2>
            <p>Keep plans, people, and code in context — with the tools your team already needs.</p>
          </div>
          <div className="landing-bento">
            {bentoFeatures.map((feature, index) => (
              <article className={`landing-bento-card landing-bento-${feature.visual}`} key={feature.id}>
                <div className="landing-bento-copy"><p className="landing-kicker">{feature.eyebrow}</p><h3>{feature.title}</h3><p>{feature.description}</p></div>
                <FeatureVisual type={feature.visual} />
                <span className="landing-bento-index">0{index + 1}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="product" className="landing-section landing-product-section" aria-labelledby="product-title">
          <div className="landing-section-heading">
            <p className="landing-kicker">A WORKSPACE THAT MAKES SENSE</p>
            <h2 id="product-title">See your workflow <span>come together.</span></h2>
            <p>Explore a sample workspace. Switch views to see how work stays connected.</p>
          </div>
          <div className="landing-product-tabs" role="tablist" aria-label="Sample product views">
            {productTabs.map((tab) => <button key={tab} type="button" role="tab" aria-controls="product-preview" aria-selected={activeTab === tab} className={activeTab === tab ? "is-active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          <ProductPreview activeTab={activeTab} />
          <p className="landing-demo-disclaimer">Illustrative sample workspace · No live data or integrations are used in this preview.</p>
        </section>

        <section id="workflow" className="landing-section landing-workflow" aria-labelledby="workflow-title">
          <div className="landing-section-heading">
            <p className="landing-kicker">FROM FIRST IDEA TO MERGED PR</p>
            <h2 id="workflow-title">A smoother path <span>from plan to done.</span></h2>
          </div>
          <div className="landing-workflow-steps">
            {[
              ["01", "Create a project", "Give the work a shared home."],
              ["02", "Invite your team", "Bring the right people in."],
              ["03", "Connect GitHub", "Link a repo when it helps."],
              ["04", "Track the work", "Assign tasks and follow progress."],
              ["05", "Ship together", "Keep updates close to the work."],
            ].map(([number, title, description], index) => (
              <div className="landing-workflow-step" key={number}><span className="landing-step-number">{number}</span><span className="landing-step-node">{index === 4 ? <CheckCircle2 size={17} /> : <span />}</span><b>{title}</b><p>{description}</p></div>
            ))}
          </div>
        </section>

        <section className="landing-section landing-comparison" aria-labelledby="comparison-title">
          <div className="landing-comparison-copy"><p className="landing-kicker">KEEP CONTEXT CLOSE</p><h2 id="comparison-title">Less context switching.<br /><span>More building.</span></h2><p>Projects, task discussions, and optional GitHub connections live side by side, so your team can find the context behind the work.</p><Link className="landing-text-link" href="/register">Make space for your work <ArrowRight size={15} /></Link></div>
          <div className="landing-compare-visual">
            <div className="landing-scattered"><span className="landing-scatter-chip">Project board</span><span className="landing-scatter-chip">Issue tracker</span><span className="landing-scatter-chip">Team updates</span><span className="landing-scatter-chip">GitHub</span><span className="landing-scatter-chip">Due dates</span><span className="landing-scatter-cross">×</span></div>
            <div className="landing-compare-arrow"><ArrowRight size={20} /></div>
            <div className="landing-unified-card"><div className="flex items-center gap-2"><BrandMark /><b>One workspace</b></div><span><FolderKanban size={14} /> Projects</span><span><ListTodo size={14} /> Tasks & issues</span>            <span><CircleDashed size={14} /> GitHub links</span><span><Users size={14} /> Team activity</span><span className="landing-unified-footer"><span className="landing-green-dot" /> Connected by context</span></div>
          </div>
        </section>

        <section className="landing-final-cta" aria-labelledby="final-cta-title">
          <div className="landing-cta-orbit landing-cta-orbit-one" />
          <div className="landing-cta-orbit landing-cta-orbit-two" />
          <div className="landing-cta-content"><p className="landing-kicker">MAKE ROOM FOR GOOD WORK</p><h2 id="final-cta-title">Your next project<br /><span>deserves a better flow.</span></h2><p>Bring your projects, teammates, and development work into one focused space.</p><div className="landing-hero-actions"><Link className="landing-button" href="/register">Get started <ArrowRight size={16} /></Link><Link className="landing-button landing-login-button" href="/login">Log in to TaskFlow <span>↗</span></Link></div></div>
          <div className="landing-cta-fragment"><div className="landing-cta-fragment-top"><span className="landing-green-dot" /> PROJECT STATUS <b>ON TRACK</b></div><strong>Website refresh</strong><div className="landing-progress"><span /></div><div className="flex items-center justify-between text-[10px] text-white/40"><span>8 of 12 tasks complete</span><AvatarStack small /></div></div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="landing-footer-brand">          <Link className="landing-wordmark" href="/"><BrandMark className="landing-brand-mark" /><span>TaskFlow</span></Link><p>A focused workspace for projects, tasks, and the people building together.</p></div>
          <div className="landing-footer-links"><div><b>Explore</b><a href="#features">Features</a><a href="#workflow">Workflow</a><Link href="/developers/api">API docs</Link></div><div><b>Company</b><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link></div><div><b>Get started</b><Link href="/login">Log in</Link><Link href="/register">Create an account</Link><a href="https://github.com/Code2With-Pratik/TaskFlow-App" target="_blank" rel="noreferrer">GitHub ↗</a></div></div>
        </div>
        <div className="landing-footer-bottom">        <span>© TaskFlow · Pratik Dhandare</span><span>Built for thoughtful teams.</span></div>
      </footer>
    </div>
  );
}
