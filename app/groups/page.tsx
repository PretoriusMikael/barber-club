import type { Metadata } from "next";
import { Groups } from "@/components/sections/Groups";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Groomsmen, Groups & Special Events",
  description:
    "Wedding parties and group bookings at Barber Club. Johnnie Red from R450 per person, Johnnie Black from R650 with exclusive use of the venue. Cuts, hot-towel shaves, massages and a drink in hand.",
  alternates: { canonical: "/groups" },
};

export default function GroupsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Groups", path: "/groups" },
        ])}
      />
      <div className="pt-16 md:pt-20">
        <Groups />
      </div>
      <FinalCta />
    </>
  );
}
