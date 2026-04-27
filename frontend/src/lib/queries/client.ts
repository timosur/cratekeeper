import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared query client. Keep retry behaviour conservative for the
 * single-operator local-first context: one retry on network errors is
 * usually enough to ride out a transient hiccup but won't mask real
 * problems (e.g. wrong token).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
      refetchOnWindowFocus: true,
    },
  },
});
