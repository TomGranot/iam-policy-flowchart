import { ScenarioPicker } from "@/components/scenario-picker"
import { FlowchartViewer } from "@/components/flowchart-viewer"
import { PolicyExamples } from "@/components/policy-examples"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IAM Policy Flowchart Companion</h1>
            <p className="text-muted-foreground mt-1">
              Visualize AWS IAM policy evaluation flows for better security decisions
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_2fr] lg:grid-cols-[300px_1fr]">
          <aside className="space-y-6">
            <ScenarioPicker />
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Quick Start</h3>
              <p className="text-sm text-muted-foreground">
                Choose a predefined scenario or upload your own IAM policy to visualize the evaluation flow. Your data
                is stored locally in your browser.
              </p>
            </div>
          </aside>
          <div className="space-y-8">
            <FlowchartViewer />
            <PolicyExamples />
          </div>
        </div>
      </div>
    </main>
  )
}
