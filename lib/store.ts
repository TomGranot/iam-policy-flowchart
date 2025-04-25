"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Scenario = {
  id: string
  name: string
  description: string
  resourceType: string
  principalType: string
  policies: string[]
  uploadedPolicy?: any // For user-uploaded policies
}

type FlowchartState = {
  scenario: Scenario | null
  setScenario: (scenario: Scenario | null) => void
  uploadedPolicies: Record<string, any>
  addUploadedPolicy: (id: string, policy: any) => void
  removeUploadedPolicy: (id: string) => void
}

export const useFlowchartStore = create<FlowchartState>()(
  persist(
    (set) => ({
      scenario: null,
      setScenario: (scenario) => set({ scenario }),
      uploadedPolicies: {},
      addUploadedPolicy: (id, policy) =>
        set((state) => ({
          uploadedPolicies: {
            ...state.uploadedPolicies,
            [id]: policy,
          },
        })),
      removeUploadedPolicy: (id) =>
        set((state) => {
          const { [id]: removed, ...rest } = state.uploadedPolicies
          return { uploadedPolicies: rest }
        }),
    }),
    {
      name: "iam-flowchart-storage",
    },
  ),
)
