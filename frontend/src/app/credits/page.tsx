import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { CreditsPageClient } from "@/components/CreditsPageClient";

export default async function CreditsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6">
        <CreditsPageClient />
      </div>
    </DashboardLayout>
  );
}
