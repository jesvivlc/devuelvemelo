import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LoanWithContact, Reminder } from "@/lib/supabase/types";
import { LoanDetail } from "./LoanDetail";

interface PageProps {
  params: { id: string };
}

export default async function LoanDetailPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: loan } = await supabase
    .from("loans_with_overdue")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!loan) notFound();

  const [{ data: reminders }, signedPhotoResult] = await Promise.all([
    supabase
      .from("reminders")
      .select("*")
      .eq("loan_id", params.id)
      .order("created_at", { ascending: false })
      .limit(10),
    loan.photo_url
      ? supabase.storage
          .from("loan-photos")
          .createSignedUrl(loan.photo_url as string, 3600)
      : Promise.resolve({ data: null }),
  ]);

  const photoSignedUrl = signedPhotoResult.data?.signedUrl ?? null;

  return (
    <LoanDetail
      loan={loan as LoanWithContact}
      reminders={(reminders as Reminder[]) ?? []}
      photoSignedUrl={photoSignedUrl}
    />
  );
}
