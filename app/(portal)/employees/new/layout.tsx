import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function NewEmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    redirect("/employees");
  }
  return <>{children}</>;
}
