"use client";

export function EmployeeFilters({
  departments,
  search,
  department,
  status,
}: {
  departments: { id: string; name: string }[];
  search?: string;
  department?: string;
  status?: string;
}) {
  return (
    <form className="flex items-center gap-3 flex-1 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"/></svg>
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search by name..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/></svg>
        <select
          name="department"
          defaultValue={department ?? "all"}
          className="text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          onChange={(e) => (e.target.form as HTMLFormElement)?.submit()}
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
      >
        Search
      </button>
      {(search || department) && (
        <a
          href={status ? `/employees?status=${status}` : "/employees"}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          Clear
        </a>
      )}
    </form>
  );
}
