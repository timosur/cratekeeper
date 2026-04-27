// Typed HTTP client. Reads VITE_API_BASE_URL and VITE_API_TOKEN at build time
// and injects the bearer token on every request.

const DEFAULT_BASE_URL = "http://localhost:8765";

function getBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const url = (typeof raw === "string" && raw.trim()) || DEFAULT_BASE_URL;
  return url.replace(/\/+$/, "");
}

function getToken(): string | undefined {
  const raw = import.meta.env.VITE_API_TOKEN;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return undefined;
}

/**
 * Error thrown for any non-2xx response or network failure. The caller
 * (typically TanStack Query) surfaces `message` to the UI.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | undefined;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** JSON body — will be stringified and Content-Type set automatically. */
  json?: unknown;
  /** Raw body. Prefer `json` for object payloads. */
  body?: BodyInit | null;
}

/**
 * Issue an authenticated request against the Cratekeeper API and return
 * the parsed JSON body. Non-2xx responses become `ApiError`. Network
 * failures become `ApiError` with status 0.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, headers, ...rest } = options;
  const token = getToken();

  const finalHeaders = new Headers(headers ?? {});
  if (token && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }
  if (json !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  const url = path.startsWith("http") ? path : `${getBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: json !== undefined ? JSON.stringify(json) : (rest.body ?? undefined),
    });
  } catch (cause) {
    throw new ApiError(
      "Could not reach the API. Check that the backend is running and VITE_API_BASE_URL is correct.",
      0,
      cause instanceof Error ? cause.message : undefined,
    );
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    const message = friendlyMessage(response.status, detail);
    throw new ApiError(message, response.status, detail);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const ct = response.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body?.detail === "string") return body.detail;
      if (body?.detail !== undefined) return JSON.stringify(body.detail);
      return undefined;
    }
    const text = await response.text();
    return text.trim() || undefined;
  } catch {
    return undefined;
  }
}

function friendlyMessage(status: number, detail: string | undefined): string {
  if (status === 401 || status === 403) {
    return "Not authorized — check VITE_API_TOKEN.";
  }
  if (status >= 500) {
    return detail ? `Server error: ${detail}` : "Server error. Try again in a moment.";
  }
  return detail || `Request failed (${status}).`;
}
