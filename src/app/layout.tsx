import "./globals.css";
import {cn} from "@/src/lib/utils";
import {Inter, Bebas_Neue} from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import type {Metadata, Viewport} from "next";

const bebas = Bebas_Neue({weight: '400', subsets: ['latin', 'latin-ext'], variable: '--font-bebas'});
const inter = Inter({subsets: ['latin', 'latin-ext'], variable: '--font-inter'});

export const viewport: Viewport = {
    viewportFit: 'cover',
    themeColor: '#f5f5f5',
    colorScheme: "only light"
};

export const metadata: Metadata = {
    title: {template: '%s · KRAK\'EM ALL 2026', default: 'KRAK\'EM ALL 2026'},
    description: 'Wyniki, ranking i harmonogram zawodów boulderowych KRAK\'EM ALL 2026 w Avatar Climbing.',
};

export default function RootLayout({children}: LayoutProps<"/">) {
    return (
        <html
            lang='pl'
            className={cn(
                "h-full", "antialiased",
                inter.variable, bebas.variable)}
        >
        <Analytics/>
        <body className="min-h-full flex flex-col touch-manipulation">{children}</body>
        </html>
    );
}
