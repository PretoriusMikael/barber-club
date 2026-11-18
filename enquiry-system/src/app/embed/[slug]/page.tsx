import { notFound } from "next/navigation";
import { loadTenant } from "@/lib/tenants/load";
import { toPublicTenant } from "@/lib/tenants/schema";
import { ClientWidget } from "./ClientWidget";

/**
 * The page that loads inside the iframe on a client's website.
 * Only toPublicTenant() data crosses to the browser — never the knowledge
 * base, notification addresses or prompt.
 */
export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await loadTenant(slug);
  if (!tenant) notFound();
  return <ClientWidget tenant={toPublicTenant(tenant)} />;
}
