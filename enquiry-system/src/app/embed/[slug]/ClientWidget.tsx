"use client";

import dynamic from "next/dynamic";
import type { PublicTenant } from "@/lib/tenants/schema";

// Client-only: the widget restores its state from sessionStorage on first render.
const ChatWidget = dynamic(() => import("./ChatWidget").then((m) => m.ChatWidget), { ssr: false });

export function ClientWidget({ tenant }: { tenant: PublicTenant }) {
  return <ChatWidget tenant={tenant} />;
}
