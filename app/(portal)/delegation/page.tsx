import { HomeTabs } from "@/components/shared/HomeTabs";
import { Users, ArrowRightLeft, Clock, Construction } from "lucide-react";

export default function DelegationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Delegation</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          Temporarily transfer your approval authority to someone else
        </p>
      </div>

      <HomeTabs />

      {/* Placeholder card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Construction className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Coming Soon</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          The delegation module will let managers transfer their leave-approval (and other) authority
          to a colleague for a defined period — useful when you go on leave yourself.
        </p>
      </div>

      {/* Planned features preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">What you&apos;ll be able to do</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Planned for the next phase</p>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {[
            {
              icon: ArrowRightLeft,
              title: "Delegate approval authority",
              desc: "Pick a colleague who can approve leaves on your behalf while you're away.",
            },
            {
              icon: Clock,
              title: "Time-bound delegation",
              desc: "Set a from–to date range — delegation auto-expires when you return.",
            },
            {
              icon: Users,
              title: "Multiple delegates",
              desc: "Different approvers for different modules (leaves, payroll, etc.).",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
