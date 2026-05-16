import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { AppSidebar } from "@/components/pos/app-sidebar";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <DashboardHome />
        </main>
      </div>
    </div>
  );
}
