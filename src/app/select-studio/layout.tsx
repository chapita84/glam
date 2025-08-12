
'use client'

import { AuthProvider } from "@/contexts/AuthContext";
import type { PropsWithChildren } from "react";

export default function SelectStudioLayout({ children }: PropsWithChildren) {
    return (
        <AuthProvider>
            <div className="flex h-screen w-full items-center justify-center bg-background">
                {children}
            </div>
        </AuthProvider>
    )
}
