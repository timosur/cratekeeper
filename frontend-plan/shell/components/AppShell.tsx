import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Library,
  ScrollText,
  Plus,
  Activity,
  Wifi,
  WifiOff,
  ChevronDown,
  Sun,
  Moon,
  FolderOpen,
  LogOut,
  Loader2,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  isActive?: boolean;
  icon: "dashboard" | "event" | "settings" | "library" | "audit";
}

export interface JobActivity {
  running: number;
  queued: number;
}

export interface ConnectionStatus {
  api: "connected" | "disconnected" | "idle";
  sse: "connected" | "disconnected" | "idle";
}

export interface ShellUser {
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface AppShellProps {
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  jobActivity?: JobActivity;
  connection?: ConnectionStatus;
  user?: ShellUser;
  version?: string;
  topBarTitle?: React.ReactNode;
  topBarBreadcrumb?: React.ReactNode;
  topBarActions?: React.ReactNode;
  theme?: "light" | "dark";
  onNavigate?: (href: string) => void;
  onNewEvent?: () => void;
  onJobsClick?: () => void;
  onOpenDataFolder?: () => void;
  onToggleTheme?: () => void;
  onLogout?: () => void;
}

const iconMap = {
  dashboard: LayoutDashboard,
  event: Calendar,
  settings: Settings,
  library: Library,
  audit: ScrollText,
};

export function AppShell({
  children,
  navigationItems,
  jobActivity = { running: 0, queued: 0 },
  connection = { api: "connected", sse: "connected" },
  user,
  version = "v1.0.0",
  topBarTitle,
  topBarBreadcrumb,
  topBarActions,
  theme = "light",
  onNavigate,
  onNewEvent,
  onJobsClick,
  onOpenDataFolder,
  onToggleTheme,
  onLogout,
}: AppShellProps) {
  return (
    <div
      className="flex h-screen w-full bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Sidebar */}
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 7l8-4 8 4M4 7v10l8 4 8-4V7M4 7l8 4m0 0l8-4m-8 4v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Cratekeeper
            </span>
          </div>
          <span
            className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-500"
            style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
          >
            {version}
          </span>
        </div>

        {/* Primary CTA */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onNewEvent}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            New Event
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {navigationItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(item.href)}
                    className={`group flex h-9 w-full items-center gap-2.5 rounded-md border-l-2 px-2.5 text-sm transition-colors ${
                      item.isActive
                        ? "border-sky-600 bg-sky-50 font-medium text-sky-700 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-300"
                        : "border-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        item.isActive
                          ? "text-sky-600 dark:text-sky-400"
                          : "text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                      }`}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* System status */}
        <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={onJobsClick}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            <div className="flex items-center gap-2">
              {jobActivity.running > 0 ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
              ) : (
                <Activity className="h-3.5 w-3.5 text-neutral-400" />
              )}
              <span className="text-neutral-600 dark:text-neutral-400">Jobs</span>
            </div>
            <span
              className="text-neutral-700 dark:text-neutral-300"
              style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
            >
              {jobActivity.running}
              <span className="text-neutral-400 dark:text-neutral-600"> / </span>
              {jobActivity.queued}
            </span>
          </button>

          <div className="mt-1 flex items-center justify-between rounded-md px-2 py-1.5 text-xs">
            <div className="flex items-center gap-2">
              {connection.api === "connected" ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className="text-neutral-600 dark:text-neutral-400">Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusDot label="API" state={connection.api} />
              <StatusDot label="SSE" state={connection.sse} />
            </div>
          </div>
        </div>

        {/* User menu */}
        <UserMenu
          user={user}
          theme={theme}
          onOpenDataFolder={onOpenDataFolder}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex min-w-0 items-center gap-3">
            {topBarBreadcrumb && (
              <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-500">
                {topBarBreadcrumb}
              </div>
            )}
            {topBarTitle && (
              <h1 className="truncate text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {topBarTitle}
              </h1>
            )}
          </div>
          {topBarActions && <div className="flex items-center gap-2">{topBarActions}</div>}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-white px-8 py-6 dark:bg-neutral-950">{children}</main>
      </div>
    </div>
  );
}

function StatusDot({ label, state }: { label: string; state: "connected" | "disconnected" | "idle" }) {
  const color =
    state === "connected"
      ? "bg-emerald-500"
      : state === "disconnected"
        ? "bg-red-500"
        : "bg-neutral-300 dark:bg-neutral-700";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-500"
      style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
      title={`${label}: ${state}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function UserMenu({
  user,
  theme,
  onOpenDataFolder,
  onToggleTheme,
  onLogout,
}: {
  user?: ShellUser;
  theme: "light" | "dark";
  onOpenDataFolder?: () => void;
  onToggleTheme?: () => void;
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative border-t border-neutral-200 dark:border-neutral-800">
      {open && (
        <div
          className="absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        >
          <button
            type="button"
            onClick={() => {
              onToggleTheme?.();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenDataFolder?.();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <FolderOpen className="h-4 w-4" />
            Open data folder
          </button>
          <div className="border-t border-neutral-200 dark:border-neutral-800" />
          <button
            type="button"
            onClick={() => {
              onLogout?.();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3 py-3 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {user?.name ?? "Operator"}
          </div>
          {user?.email && (
            <div
              className="truncate text-[10px] text-neutral-500"
              style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
            >
              {user.email}
            </div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
