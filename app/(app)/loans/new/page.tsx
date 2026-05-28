import { createClient } from "@/lib/supabase/server";
import { LoanForm } from "./LoanForm";
import type { Contact } from "@/lib/supabase/types";

export default async function NewLoanPage() {
  const supabase = createClient();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, display_name, phone, email, relationship")
    .order("display_name", { ascending: true });

  return <LoanForm contacts={(contacts as Contact[]) ?? []} />;
}
