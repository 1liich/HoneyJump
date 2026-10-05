import { supabase } from "@/integrations/supabase/client";

export type EmailRecord = {
  id: string;
  user_id: string;
  email: string;
  dollars: number;
  paid: boolean;
  active: boolean;
  devices: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailInput = {
  email: string;
  dollars: number;
  paid: boolean;
  active: boolean;
  devices: number;
  notes?: string | null;
};

export async function fetchEmails(): Promise<EmailRecord[]> {
  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EmailRecord[];
}

export async function createEmail(input: EmailInput) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sessão expirada");
  const { error } = await supabase
    .from("emails")
    .insert({ ...input, user_id: userData.user.id });
  if (error) throw error;
}

export async function updateEmail(id: string, input: Partial<EmailInput>) {
  const { error } = await supabase.from("emails").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEmail(id: string) {
  const { error } = await supabase.from("emails").delete().eq("id", id);
  if (error) throw error;
}
