"use client"

import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react"
import type { AccountMode } from "./types"
import { initialLeads, initialContentItems, type Lead, type ContentItem } from "./mock-data"

interface StoreContextType {
  mode: AccountMode
  setMode: (mode: AccountMode) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  leads: Lead[]
  setLeads: Dispatch<SetStateAction<Lead[]>>
  contentItems: ContentItem[]
  setContentItems: Dispatch<SetStateAction<ContentItem[]>>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

/**
 * Provider component that wraps the application and provides global state
 * for account mode (business/personal) and sidebar visibility.
 * 
 * @param children - The child components to wrap.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AccountMode>("business")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContentItems)

  return (
    <StoreContext.Provider
      value={{ mode, setMode, sidebarOpen, setSidebarOpen, leads, setLeads, contentItems, setContentItems }}
    >
      {children}
    </StoreContext.Provider>
  )
}

/**
 * Custom hook to access the global store context.
 * 
 * @returns The store context value containing mode and sidebar state.
 * @throws Error if used outside of a StoreProvider.
 */
export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}
