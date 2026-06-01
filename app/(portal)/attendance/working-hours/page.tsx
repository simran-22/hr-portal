import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listWorkingHoursForSession, parseMonthParam } from "@/lib/working-hours";
import { WorkingHoursClient } from "./WorkingHoursClient";

type SearchParams = Promise<{ month?: string }>;

export default async function WorkingHoursPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { month } = await searchParams;
  const spec = parseMonthParam(month);
  const monthStr = `${spec.year}-${String(spec.month).padStart(2, "0")}`;

  const rows = await listWorkingHoursForSession(session, spec);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Working Hours</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          Shift-based monthly summary — expected vs actual hours, late, early-leave, overtime
        </p>
      </div>

      <WorkingHoursClient initialRows={rows} initialMonth={monthStr} scope={session.role} />
    </div>
  );
}
