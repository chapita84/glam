'use client';

import { ReactNode } from 'react';

// This is a simple layout that just centers its content,
// without the complex redirection logic of the main AppLayout.
export default function SelectStudioLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            {children}
        </div>
    );
}
