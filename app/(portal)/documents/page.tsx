import { FolderOpen, Plus, FileText, Download, Eye } from "lucide-react";

const DOCS = [
  { name: "Employee Handbook 2025",    type: "PDF",  size: "2.4 MB", updated: "Jan 15, 2025", category: "Policy" },
  { name: "Leave Policy",              type: "PDF",  size: "512 KB", updated: "Feb 01, 2025", category: "Policy" },
  { name: "Code of Conduct",           type: "DOCX", size: "1.1 MB", updated: "Jan 10, 2025", category: "Policy" },
  { name: "Payroll Structure FY2025",  type: "XLSX", size: "340 KB", updated: "Apr 01, 2025", category: "Finance" },
  { name: "Onboarding Checklist",      type: "PDF",  size: "890 KB", updated: "Mar 20, 2025", category: "HR" },
  { name: "Performance Review Form",   type: "DOCX", size: "220 KB", updated: "Mar 01, 2025", category: "HR" },
  { name: "NDA Template",              type: "DOCX", size: "130 KB", updated: "Jan 05, 2025", category: "Legal" },
  { name: "Offer Letter Template",     type: "DOCX", size: "95 KB",  updated: "Feb 14, 2025", category: "Recruitment" },
];

const typeColor: Record<string, string> = {
  PDF:  "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  DOCX: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  XLSX: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
};

const catColor: Record<string, string> = {
  Policy:      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  Finance:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  HR:          "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Legal:       "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Recruitment: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
};

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Documents</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{DOCS.length} company documents</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              {["Document","Type","Category","Size","Last Updated","Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {DOCS.map((doc, i) => (
              <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{doc.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${typeColor[doc.type]}`}>{doc.type}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${catColor[doc.category]}`}>{doc.category}</span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.size}</td>
                <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.updated}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
