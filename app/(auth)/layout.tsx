import type React from "react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f4f4f4] dark:bg-slate-950 p-4">
            {/* Subtle ambient lighting */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/15 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Content container */}
            <div className="relative z-10 w-full max-w-2xl mx-auto">
                {children}
            </div>
        </div>
    )
}

