import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LoanWithContact } from "@/lib/supabase/types";
import { LoanEditForm } from "./LoanEditForm";

export default async function EditLoanPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: loan } = await supabase
    .from("loans_with_overdue")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!loan) notFound();

  const l = loan as unknown as LoanWithContact;

  // No se pueden editar préstamos cerrados
  if (l.status === "resolved" || l.status === "written_off") {
    redirect(`/loans/${params.id}`);
  }

  return <LoanEditForm loan={l} />;
}
