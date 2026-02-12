import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { HeaderServer } from "./_components/layout/header-server";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Better Music League",
    template: "%s | Better Music League",
  },
  description:
    "Compete with friends to find the best music. Create leagues, submit songs, vote on tracks, and crown the champion.",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  openGraph: {
    title: "Better Music League",
    description:
      "Compete with friends to find the best music. Create leagues, submit songs, vote on tracks, and crown the champion.",
    type: "website",
    siteName: "Better Music League",
  },
  twitter: {
    card: "summary",
    title: "Better Music League",
    description:
      "Compete with friends to find the best music. Create leagues, submit songs, vote on tracks, and crown the champion.",
  },
  metadataBase: new URL(
    process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:3000",
  ),
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <HeaderServer />
          <main>{children}</main>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
