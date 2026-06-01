import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

function roleLabel(role: string): string {
  if (role === "admin") return "HR";
  if (role === "manager") return "Manager";
  return "Employee";
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar userName={session.name} userRole={session.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={`HR Portal — ${roleLabel(session.role)}`} userName={session.name} userRole={session.role} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
