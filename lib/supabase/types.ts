export type Tone =
  | "humoristico"
  | "sarcastico"
  | "pasivo"
  | "serio"
  | "profesional"
  | "riguroso";

export type LoanKind = "object" | "money";

export type LoanStatus =
  | "active"
  | "overdue"
  | "reminded"
  | "resolved"
  | "written_off";

export type Relationship =
  | "amigo"
  | "familia"
  | "cuñado"
  | "compañero"
  | "hermano"
  | "vecino"
  | "otro";

export type Channel = "whatsapp" | "sms" | "email";

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  default_tone: Tone;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  relationship: Relationship;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  owner_id: string;
  contact_id: string;
  kind: LoanKind;
  title: string;
  description: string | null;
  amount_cents: number | null;
  currency: string;
  photo_url: string | null;
  loaned_at: string;
  due_at: string;
  status: LoanStatus;
  reminder_count: number;
  last_reminded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanWithContact extends Loan {
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_relationship: Relationship;
  days_overdue: number;
  computed_status: LoanStatus | "overdue";
}

export interface Reminder {
  id: string;
  loan_id: string;
  owner_id: string;
  tone: Tone;
  channel: Channel | null;
  generated_copy: string;
  edited_copy: string | null;
  was_sent: boolean;
  sent_at: string | null;
  llm_model: string | null;
  llm_tokens_in: number | null;
  llm_tokens_out: number | null;
  created_at: string;
}

export type EventType =
  | "signup"
  | "loan_created"
  | "loan_resolved"
  | "loan_written_off"
  | "reminder_generated"
  | "reminder_sent"
  | "tone_selected"
  | "contact_created";
