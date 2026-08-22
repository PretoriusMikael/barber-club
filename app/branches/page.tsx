import type { Metadata } from "next";
import { branches } from "@/content/branches";
import { Branches } from "@/components/sections/Branches";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd, breadcrumbSchema, branchSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Branches | Barber Shops Across the Cape Winelands",
  description:
    "All 11 Barber Club branches: Paarl (Val de Vie, Central, North, Rivo Quarters), Stellenbosch (Bird Street, Neelsie, Stelmark), Wellington, Malmesbury, Durbanville and Franschhoek. Addresses, hours and phone numbers.",
  alternates: { canonical: "/branches" },
};

/**
 * Emits a HairSalon block for every branch. For a chain this matters: one
 * LocalBusiness entity for eleven shops gives Google one thing to rank instead
 * of eleven, and is a common, costly local-SEO mistake.
 */
export default function BranchesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Branches", path: "/branches" },
        ])}
      />
      {branches.map((b) => (
        <JsonLd key={b.slug} data={branchSchema(b)} />
      ))}

      <div className="pt-16 md:pt-20">
        <Branches />
      </div>
      <FinalCta />
    </>
  );
}
