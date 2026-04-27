import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";

export interface NewEventValues {
  name: string;
  date: string;
  spotifyUrl: string;
}

export interface NewEventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: NewEventValues) => void;
}

export function NewEventModal({ open, onClose, onSubmit }: NewEventModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setDate("");
      setSpotifyUrl("");
      return;
    }
    const handle = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(handle);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), date, spotifyUrl: spotifyUrl.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-event-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <h2
            id="new-event-title"
            className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
          >
            New event
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Name" htmlFor="event-name">
            <input
              ref={firstFieldRef}
              id="event-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wedding · Mara & Jonas"
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </Field>

          <Field label="Date" htmlFor="event-date">
            <input
              id="event-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </Field>

          <Field label="Spotify URL" htmlFor="event-spotify">
            <input
              id="event-spotify"
              type="url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/…"
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              Create event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}
