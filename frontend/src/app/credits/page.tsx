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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Buy Credits</h1>
          <p className="text-gray-400">
            Purchase API credits to use OneRouter services. Each API call costs 1 credit.
          </p>
        </div>

        <CreditsPageClient />
      </div>
    </DashboardLayout>
  );
}
