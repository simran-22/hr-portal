import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard", "/employees": "Employees", "/attendance": "Attendance",
  "/leaves": "Leave Management", "/payroll": "Payroll", "/performance": "Performance",
  "/recruitment": "Recruitment", "/settings": "Settings",
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar userName={session.name} userRole={session.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="HR Portal" userName={session.name} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
