"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"
import { useFlowchartStore } from "@/lib/store"
import { generateFlowchartDefinition } from "@/lib/flowchart-generator"
import mermaid from "mermaid"

export function FlowchartViewer() {
  const scenario = useFlowchartStore((state) => state.scenario)
  const flowchartRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
      },
    })
  }, [])

  useEffect(() => {
    if (scenario) {
      renderFlowchart()
    }
  }, [scenario])

  const renderFlowchart = useCallback(async () => {
    if (!scenario || !flowchartRef.current) return

    setIsRendering(true)

    try {
      const flowchartDefinition = generateFlowchartDefinition(scenario)

      // Clear previous content
      flowchartRef.current.innerHTML = ""

      // Create a div for mermaid to render into
      const mermaidDiv = document.createElement("div")
      mermaidDiv.className = "mermaid"
      mermaidDiv.textContent = flowchartDefinition
      flowchartRef.current.appendChild(mermaidDiv)

      // Initialize mermaid with the current theme
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
        },
        securityLevel: "loose",
      })

      // Render the flowchart
      await mermaid.run({
        nodes: [mermaidDiv],
      })
    } catch (error) {
      console.error("Error rendering flowchart:", error)
      if (flowchartRef.current) {
        flowchartRef.current.innerHTML = `<div class="p-4 text-red-500">Error rendering flowchart: ${error.message}</div>`
      }
    } finally {
      setIsRendering(false)
    }
  }, [scenario])

  // Re-render flowchart when theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          if (scenario) {
            renderFlowchart()
          }
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => {
      observer.disconnect()
    }
  }, [scenario, renderFlowchart])

  const handleExport = () => {
    if (!flowchartRef.current) return

    const svgElement = flowchartRef.current.querySelector("svg")
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.fillRect(0, 0, canvas.width, canvas.height)
      ctx?.drawImage(img, 0, 0)

      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `iam-flowchart-${scenario?.id || "export"}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>IAM Policy Flowchart</CardTitle>
          <CardDescription>
            {scenario ? scenario.description : "Select a scenario to generate a flowchart"}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={renderFlowchart} disabled={isRendering || !scenario}>
            <RefreshCw className={`h-4 w-4 ${isRendering ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport} disabled={!scenario}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {scenario ? (
          <div
            className="overflow-auto border rounded-md p-4 bg-background min-h-[400px]"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            <div ref={flowchartRef} className="mermaid"></div>
          </div>
        ) : (
          <div className="flex items-center justify-center border rounded-md p-8 min-h-[400px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              Select a scenario from the panel on the left to generate a flowchart
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
