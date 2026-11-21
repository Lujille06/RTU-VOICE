import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/Toast";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "RTU Voice",
    template: "%s · RTU Voice",
  },
  description:
    "RTU Voice: an AI-assisted student concern and feedback system for Rizal Technological University - Pasig Campus.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12224a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}