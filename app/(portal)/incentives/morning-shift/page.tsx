import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listIncentivesForSession, parseMonthParam } from "@/lib/incentives";
import { IncentiveTabs } from "../IncentiveTabs";
import { MorningShiftClient } from "./MorningShiftClient";

type SearchParams = Promise<{ month?: string }>;

export default async function MorningShiftIncentivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { month } = await searchParams;
  const spec = parseMonthParam(month);
  const monthStr = `${spec.year}-${String(spec.month).padStart(2, "0")}`;

  const rows = await listIncentivesForSession(session, spec);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Incentives</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          Variable pay and morning-shift incentives
        </p>
      </div>

      <IncentiveTabs />

      <MorningShiftClient initialRows={rows} initialMonth={monthStr} scope={session.role} />
    </div>
  );
}
