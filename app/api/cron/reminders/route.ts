import "server-only";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

function getResend(): Resend {
  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

type OverdueLoan = {
  id: string;
  title: string;
  owner_id: string;
  due_at: string;
  contact_name: string;
};

type UserRow = { id: string; email: string };

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: rawLoans, error } = await service
    .from("loans_with_overdue")
    .select("id, title, owner_id, due_at, contact_name")
    .not("status", "in", "(resolved,written_off)")
    .lt("due_at", today);

  if (error) {
    console.error("[cron/reminders] DB error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const overdueLoans = (rawLoans ?? []) as unknown as OverdueLoan[];
  if (overdueLoans.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Agrupar por propietario
  const byOwner: Record<string, OverdueLoan[]> = {};
  for (const loan of overdueLoans) {
    const bucket = byOwner[loan.owner_id];
    if (bucket) {
      bucket.push(loan);
    } else {
      byOwner[loan.owner_id] = [loan];
    }
  }

  const { data: rawUsers } = await service
    .from("users")
    .select("id, email")
    .in("id", Object.keys(byOwner));

  const users = (rawUsers ?? []) as unknown as UserRow[];
  const resend = getResend();
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://devuelvemelo.app";
  const from =
    process.env["RESEND_FROM_EMAIL"] ??
    "Devuélvemelo <avisos@devuelvemelo.app>";

  let sent = 0;

  for (const user of users) {
    const loans = byOwner[user.id] ?? [];
    if (loans.length === 0) continue;

    const count = loans.length;
    const subject = `Tienes ${count} préstamo${count !== 1 ? "s" : ""} vencido${count !== 1 ? "s" : ""}`;

    const items = loans.map((l) => {
      const days = Math.floor(
        (Date.now() - new Date(l.due_at).getTime()) / 86_400_000
      );
      return { title: l.title, contact: l.contact_name, days };
    });

    const textBody = [
      "Hola,",
      "",
      `Estos préstamos llevan días vencidos:`,
      "",
      ...items.map((i) => `• ${i.title} — ${i.contact} (${i.days}d de retraso)`),
      "",
      `Entra a reclamarlos: ${appUrl}/dashboard`,
      "",
      "— Devuélvemelo",
    ].join("\n");

    const htmlBody = `
<p style="font-family:sans-serif;color:#111827">Hola,</p>
<p style="font-family:sans-serif;color:#374151">Estos préstamos llevan días vencidos:</p>
<ul style="font-family:sans-serif;color:#374151">
  ${items
    .map(
      (i) =>
        `<li><strong>${i.title}</strong> &mdash; ${i.contact} <span style="color:#ef4444">(${i.days}d de retraso)</span></li>`
    )
    .join("")}
</ul>
<p style="margin-top:24px">
  <a href="${appUrl}/dashboard"
     style="background:#4f46e5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-family:sans-serif;display:inline-block">
    Ver mis préstamos →
  </a>
</p>
<p style="font-family:sans-serif;color:#9ca3af;font-size:12px;margin-top:32px">
  Devuélvemelo &middot; <a href="${appUrl}" style="color:#9ca3af">${appUrl.replace("https://", "")}</a>
</p>`;

    try {
      await resend.emails.send({
        from,
        to: user.email,
        subject,
        text: textBody,
        html: htmlBody,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/reminders] email failed for ${user.email}:`, err);
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
