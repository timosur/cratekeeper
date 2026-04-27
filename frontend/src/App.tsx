import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { AppShell, type NavigationItem } from "./shell";
import { NewEventModal, type NewEventValues } from "./components/NewEventModal";
import { NewEventContext } from "./components/NewEventContext";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuditPage } from "./pages/AuditPage";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Events",
  "/library": "Master Library",
  "/settings": "Settings",
  "/audit": "Audit Log",
};

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [isNewEventOpen, setNewEventOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const navigationItems: NavigationItem[] = useMemo(
    () => [
      {
        label: "Events",
        href: "/",
        icon: "event",
        isActive: location.pathname === "/" || location.pathname.startsWith("/events"),
      },
      {
        label: "Master Library",
        href: "/library",
        icon: "library",
        isActive: location.pathname.startsWith("/library"),
      },
      {
        label: "Settings",
        href: "/settings",
        icon: "settings",
        isActive: location.pathname.startsWith("/settings"),
      },
      {
        label: "Audit Log",
        href: "/audit",
        icon: "audit",
        isActive: location.pathname.startsWith("/audit"),
      },
    ],
    [location.pathname],
  );

  const topBarTitle = useMemo(() => {
    if (location.pathname.startsWith("/events/")) {
      const id = location.pathname.split("/")[2];
      return id ? `Event · ${id}` : "Event";
    }
    return ROUTE_TITLES[location.pathname] ?? "Events";
  }, [location.pathname]);

  const handleNewEventSubmit = useCallback(
    (values: NewEventValues) => {
      setNewEventOpen(false);
      const slug = values.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const id = slug || `event-${Date.now()}`;
      navigate(`/events/${id}`);
    },
    [navigate],
  );

  const newEventController = useMemo(
    () => ({ open: () => setNewEventOpen(true) }),
    [],
  );

  return (
    <NewEventContext.Provider value={newEventController}>
      <AppShell
        navigationItems={navigationItems}
        jobActivity={{ running: 0, queued: 0 }}
        connection={{ api: "connected", sse: "connected" }}
        user={{ name: "Operator", email: "operator@cratekeeper.local" }}
        version="v0.1.0"
        theme={theme}
        topBarTitle={topBarTitle}
        onNavigate={(href) => navigate(href)}
        onNewEvent={() => setNewEventOpen(true)}
        onJobsClick={() => navigate("/jobs")}
        onOpenDataFolder={() => {
          // wire to local API once backend exposes it
          console.info("open data folder requested");
        }}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        onLogout={() => {
          console.info("logout requested");
        }}
      >
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      <NewEventModal
        open={isNewEventOpen}
        onClose={() => setNewEventOpen(false)}
        onSubmit={handleNewEventSubmit}
      />

      <UnsupportedViewportNotice />
    </NewEventContext.Provider>
  );
}

function UnsupportedViewportNotice() {
  return (
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-white px-6 text-center text-neutral-700 max-[1023px]:flex dark:bg-neutral-950 dark:text-neutral-300">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Open on a wider screen</h2>
        <p className="text-sm text-neutral-500">
          Cratekeeper is a desktop operator tool. Please use a viewport of at
          least 1024px wide.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
