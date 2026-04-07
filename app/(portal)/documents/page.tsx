import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { FolderOpen, FileText, Download, Eye, Trash2 } from "lucide-react";
import { UploadDocumentButton } from "@/components/shared/UploadDocumentButton";
import { DeleteDocumentButton } from "@/components/shared/DeleteDocumentButton";

async function getDocuments() {
  const { data } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

const typeColor: Record<string, string> = {
  PDF: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  DOCX: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  XLSX: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  PNG: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  JPG: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
};

const catColor: Record<string, string> = {
  General: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400",
  Policy: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  Finance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  HR: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Legal: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Recruitment: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DocumentsPage() {
  const session = await getSession();
  const canManage = session && ["admin"].includes(session.role);
  const documents = await getDocuments();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Documents</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{documents.length} company document{documents.length !== 1 ? "s" : ""}</p>
        </div>
        {canManage && <UploadDocumentButton />}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No documents yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upload documents to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                {["Document", "Type", "Category", "Size", "Uploaded", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {documents.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${typeColor[doc.file_type] ?? "bg-slate-100 text-slate-600"}`}>{doc.file_type}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${catColor[doc.category] ?? catColor.General}`}>{doc.category}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.file_size ?? "—"}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(doc.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {doc.file_url && (
                        <>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">
                            <Eye className="w-4 h-4" />
                          </a>
                          <a href={doc.file_url} download className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                            <Download className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      {canManage && <DeleteDocumentButton id={doc.id} name={doc.name} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
