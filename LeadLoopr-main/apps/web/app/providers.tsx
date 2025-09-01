"use client";

import { ReactNode, useState } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
// (optional) bring other client-only providers here later (Tooltip, QueryClient, etc.)

export default function Providers({ children }: { children: ReactNode }) {
    // nothing fancy needed—ThemeProvider must be in a client component
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
        </ThemeProvider>
    );
}
