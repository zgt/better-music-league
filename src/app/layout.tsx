import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { HeaderServer } from "./_components/layout/header-server";

export const metadata: Metadata = {
  title: "Better Music League",
  description: "A social music competition platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <HeaderServer />
          <main>{children}</main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
