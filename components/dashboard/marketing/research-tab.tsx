"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BrainCircuit, Target, TrendingUp, AlertTriangle, Lightbulb, Send, Sparkles, RefreshCw, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface ResearchReport {
    summary: string
    competitors: { name: string; strength: string; weakness: string }[]
    trends: string[]
    strategy: string[]
}

export function ResearchTab() {
    const { businessProfile } = useAuth()
    const [workflow, setWorkflow] = useState<"research" | "generate">("research")
    const [prompt, setPrompt] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [loadingStage, setLoadingStage] = useState<string>("")
    const [report, setReport] = useState<ResearchReport | null>(null)
    const [generatedResult, setGeneratedResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [simulate, setSimulate] = useState(true)
    const [copied, setCopied] = useState(false)

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        const trimmedPrompt = prompt.trim()
        console.log("[Agent Runner] Submit triggered with prompt:", trimmedPrompt)
        console.log("[Agent Runner] Selected workflow:", workflow)

        if (!trimmedPrompt) {
            toast.error("Please enter a prompt or research request")
            return
        }

        setLoading(true)
        setError(null)
        setReport(null)
        setGeneratedResult(null)

        try {
            if (workflow === "research") {
                setLoadingStage("Extracting business & market parameters...")
                console.log("[Agent Runner] Calling /api/marketing/extract...")

                const extractRes = await fetch("/api/marketing/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: trimmedPrompt,
                        workflow: "research",
                    }),
                })

                let extracted: any = {}
                if (extractRes.ok) {
                    extracted = await extractRes.json()
                    console.log("[Agent Runner] Extracted business profile:", extracted)
                } else {
                    console.warn("[Agent Runner] Extraction returned non-200, falling back to heuristic parsing")
                }

                const resolvedBusinessProfile = {
                    businessName: extracted.businessName || businessProfile?.businessName || "Interior Studio",
                    niche: extracted.niche || businessProfile?.niche || "Boutique Interior Design",
                    category: extracted.category || businessProfile?.category || "services",
                    address: {
                        city: extracted.city || businessProfile?.address?.city || "Austin",
                    },
                }

                const resolvedMarketingConfig = {
                    goal: extracted.marketingGoal || businessProfile?.marketing?.goal || "Market Growth & Competitor Analysis",
                    budget: extracted.budget || businessProfile?.marketing?.budget || "Standard",
                    channels: extracted.channels
                        ? (typeof extracted.channels === "string" ? extracted.channels.split(",").map((c: string) => c.trim()) : extracted.channels)
                        : (businessProfile?.marketing?.channels || ["Social Media", "SEO", "Direct Outreach"]),
                }

                setLoadingStage("Conducting deep competitor & trend analysis...")
                console.log("[Agent Runner] Calling /api/marketing/research with payload:", {
                    businessProfile: resolvedBusinessProfile,
                    marketingConfig: resolvedMarketingConfig,
                    simulatePerplexity: simulate,
                })

                const researchRes = await fetch("/api/marketing/research", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        businessProfile: resolvedBusinessProfile,
                        marketingConfig: resolvedMarketingConfig,
                        simulatePerplexity: simulate,
                    }),
                })

                const data = await researchRes.json()
                console.log("[Agent Runner] Research API Response:", data)

                if (!researchRes.ok) {
                    throw new Error(data.error || data.details || `Research failed with status ${researchRes.status}`)
                }

                setReport(data)
                toast.success("Market research completed successfully!")
            } else {
                setLoadingStage("Extracting content parameters...")
                console.log("[Agent Runner] Calling /api/marketing/extract for generate...")

                const extractRes = await fetch("/api/marketing/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: trimmedPrompt,
                        workflow: "generate",
                    }),
                })

                let extracted: any = {}
                if (extractRes.ok) {
                    extracted = await extractRes.json()
                    console.log("[Agent Runner] Extracted content params:", extracted)
                }

                setLoadingStage("Generating marketing copy with AI...")
                const generateRes = await fetch("/api/marketing/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic: extracted.topic || trimmedPrompt,
                        tone: extracted.tone || "professional",
                        format: extracted.contentFormat || "social_post",
                        businessContext: {
                            businessName: extracted.businessName || businessProfile?.businessName || "Business",
                            niche: extracted.niche || businessProfile?.niche || "Professional Services",
                            category: extracted.category || businessProfile?.category || "services",
                            targetAudience: extracted.targetAudience,
                        },
                    }),
                })

                const data = await generateRes.json()
                console.log("[Agent Runner] Generate API Response:", data)

                if (!generateRes.ok) {
                    throw new Error(data.error || data.details || "Content generation failed")
                }

                setGeneratedResult(data.content)
                toast.success("Marketing content generated successfully!")
            }
        } catch (err: any) {
            console.error("[Agent Runner] Execution error:", err)
            setError(err.message || "Failed to execute agent request")
            toast.error(err.message || "Failed to execute agent request")
        } finally {
            setLoading(false)
            setLoadingStage("")
        }
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success("Copied to clipboard")
    }

    return (
        <div className="space-y-6">
            {/* Agent Runner Prompt & Control Card */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <BrainCircuit className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">AI Agent Runner</CardTitle>
                                <CardDescription>
                                    Execute autonomous research and marketing agents from natural language requests
                                </CardDescription>
                            </div>
                        </div>

                        {/* Workflow Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                What should the agent do?
                            </span>
                            <Select
                                value={workflow}
                                onValueChange={(val: "research" | "generate") => setWorkflow(val)}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="research">research</SelectItem>
                                    <SelectItem value="generate">generate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="agent-prompt-input"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Agent Prompt / Request
                                </label>
                                <span className="text-xs text-muted-foreground">
                                    Type your request or paste your prompt below
                                </span>
                            </div>

                            <Textarea
                                id="agent-prompt-input"
                                placeholder={
                                    workflow === "research"
                                        ? "e.g. I want a market research report for Axios Interior Studio, a boutique interior design studio in Austin."
                                        : "e.g. Write a high-converting LinkedIn post announcing our new AI consulting services for tech startups."
                                }
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                        e.preventDefault()
                                        handleSubmit()
                                    }
                                }}
                                disabled={loading}
                                rows={4}
                                className="resize-y text-base font-sans leading-relaxed focus-visible:ring-primary"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                            <label className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={simulate}
                                    onChange={(e) => setSimulate(e.target.checked)}
                                    disabled={loading}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                />
                                <span>Simulate live web search (save API credits)</span>
                            </label>

                            <div className="flex items-center gap-2 justify-end">
                                {prompt.trim().length === 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-muted-foreground"
                                        onClick={() =>
                                            setPrompt(
                                                "I want a market research report for Axios Interior Studio, a boutique interior design studio in Austin."
                                            )
                                        }
                                        disabled={loading}
                                    >
                                        Use Example Prompt
                                    </Button>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || prompt.trim().length === 0}
                                    className="min-w-[120px] font-semibold"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Running...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>

                {loading && (
                    <CardFooter className="bg-muted/40 border-t py-3">
                        <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{loadingStage || "Executing agent workflow..."}</span>
                        </div>
                    </CardFooter>
                )}
            </Card>

            {/* Error Message */}
            {error && (
                <Card className="border-destructive/50 bg-destructive/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive font-bold mb-2">
                            <AlertTriangle className="h-5 w-5" />
                            Execution Error
                        </div>
                        <p className="text-sm text-destructive">{error}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Verify your prompt input and ensure the server has GEMINI_API_KEY configured.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Structured Market Research Result */}
            {report && (
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Lightbulb className="h-5 w-5 text-primary" />
                                Executive Summary
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(report.summary)}
                            >
                                {copied ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
                                {copied ? "Copied" : "Copy"}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
                                {report.summary || "No summary available."}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    Competitor Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {report.competitors?.length ? (
                                        report.competitors.map((comp, i) => (
                                            <div key={i} className="p-3 bg-muted/60 rounded-lg space-y-2 border">
                                                <div className="font-semibold text-sm flex items-center justify-between">
                                                    {comp.name}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="text-green-600 dark:text-green-400">
                                                        <span className="font-bold">Strength:</span> {comp.strength}
                                                    </div>
                                                    <div className="text-red-600 dark:text-red-400">
                                                        <span className="font-bold">Weakness:</span> {comp.weakness}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No competitor data found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                        Key Trends
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {report.trends?.length ? (
                                            report.trends.map((trend, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">
                                                        {i + 1}
                                                    </Badge>
                                                    <span className="text-sm">{trend}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground">No trends identified.</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Target className="h-5 w-5 text-green-500" />
                                        Recommended Strategy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2.5">
                                        {report.strategy?.length ? (
                                            report.strategy.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <span className="text-primary font-bold text-base leading-none">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground">No strategy recommendations.</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setReport(null)
                                setPrompt("")
                            }}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            New Research Request
                        </Button>
                    </div>
                </div>
            )}

            {/* Generated Copy Result */}
            {generatedResult && (
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Generated Marketing Content
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(generatedResult)}
                        >
                            {copied ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied ? "Copied" : "Copy Content"}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted/40 rounded-lg border font-sans text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                            {generatedResult}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setGeneratedResult(null)
                                setPrompt("")
                            }}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate Another
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
