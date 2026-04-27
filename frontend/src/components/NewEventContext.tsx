import { createContext, useContext } from "react";

export interface NewEventController {
  open: () => void;
}

export const NewEventContext = createContext<NewEventController>({
  open: () => {},
});

export function useNewEvent() {
  return useContext(NewEventContext);
}
