
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from '@/contexts/AuthContext';
import { StudioProvider } from '@/contexts/StudioContext';
import { StudioDataProvider } from '@/contexts/StudioDataContext';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GlamDash",
  description: "Your studio, managed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <StudioProvider>
              <StudioDataProvider>
                {children}
              </StudioDataProvider>
            </StudioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
