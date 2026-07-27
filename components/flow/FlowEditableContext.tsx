"use client";

import { createContext, useContext } from "react";

const FlowEditableContext = createContext(false);

export function FlowEditableProvider({ children }: { children: React.ReactNode }) {
  return <FlowEditableContext.Provider value={true}>{children}</FlowEditableContext.Provider>;
}

export function useFlowEditable() {
  return useContext(FlowEditableContext);
}
