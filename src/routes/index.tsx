import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, Copy, LogOut, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmailFormDialog } from "@/components/EmailFormDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  createEmail,
  deleteEmail,
  fetchEmails,
  updateEmail,
  type EmailInput,
  type EmailRecord,
} from "@/lib/emails";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Emails Honeygain — Gerenciador de contas" },
      {
        name: "description",
        content: "Gerencie suas contas Honeygain, valores, pagamentos, atividade e dispositivos.",
      },
      { property: "og:title", content: "Emails Honeygain — Gerenciador de contas" },
      {
        property: "og:description",
        content: "Gerencie suas contas Honeygain, valores, pagamentos, atividade e dispositivos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function Index() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["emails"] });
  const saveMutation = useMutation({
    mutationFn: async (input: EmailInput) => {
      if (editing) await updateEmail(editing.id, input);
      else await createEmail(input);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Registro atualizado" : "Email adicionado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) => updateEmail(id, { paid }),
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });
  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateEmail(id, { active }),
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmail(id),
    onSuccess: () => {
      setSelectedId(null);
      invalidate();
      toast.success("Registro removido");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(
    () => records.filter((record) => record.email.toLowerCase().includes(search.trim().toLowerCase())),
    [records, search],
  );
  const selected = records.find((record) => record.id === selectedId) ?? filtered[0] ?? null;
  const totalBilled = records.reduce((sum, record) => sum + Number(record.dollars), 0);
  const totalReceived = records
    .filter((record) => record.paid)
    .reduce((sum, record) => sum + Number(record.dollars), 0);
  const paidCount = records.filter((record) => record.paid).length;
  const activeCount = records.filter((record) => record.active).length;

  async function copyEmail(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Email copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  function editRecord(record: EmailRecord) {
    setEditing(record);
    setDialogOpen(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-header">
        <div className="mx-auto flex min-h-[90px] max-w-[1440px] items-center gap-5 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary">
              <AtSign className="size-5" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-none sm:text-xl">
                EMAILS <span className="text-primary">HONEYGAIN</span>
              </h1>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">Gerenciamento de contas Honeygain</p>
            </div>
          </div>

          <div className="ml-auto hidden w-56 items-center gap-2 rounded-xl border border-border bg-background px-3 lg:flex">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar email..."
              aria-label="Buscar email"
              className="h-10 min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="hidden min-w-[136px] rounded-xl border border-border bg-background px-4 py-2 md:block">
            <span className="block text-[10px] uppercase text-muted-foreground">Total faturado</span>
            <span className="font-mono text-lg font-bold text-success">$ {totalBilled.toFixed(2)}</span>
          </div>

          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            aria-label="Novo Email"
            className="ml-auto size-10 shrink-0 rounded-xl px-0 font-bold shadow-primary sm:ml-0 sm:h-10 sm:w-auto sm:px-5"
          >
            <Plus className="size-4" /> <span className="hidden sm:inline">Novo Email</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Sair"
            title="Sair"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 md:px-6 xl:grid-cols-[minmax(0,1fr)_395px]">
        <main className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-muted-foreground">Diretório de emails</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {filtered.length} de {records.length} registros
            </span>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 lg:hidden">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar email..."
              aria-label="Buscar email"
              className="h-11 min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-3">
            {isLoading && <p className="py-8 text-center font-mono text-sm text-muted-foreground">Carregando registros...</p>}
            {!isLoading && filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
                Nenhum email encontrado.
              </div>
            )}
            {filtered.map((record, index) => {
              const active = selected?.id === record.id;
              return (
                <div
                  key={record.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(record.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedId(record.id);
                  }}
                  className={`group grid min-h-[76px] cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-card px-5 transition-colors ${
                    active ? "border-border border-l-4 border-l-primary" : "border-border hover:border-primary/35"
                  }`}
                >
                  <div
                    className={`flex size-9 items-center justify-center rounded-xl border font-mono text-xs font-medium ${
                      index % 3 === 0
                        ? "border-danger/40 bg-danger/10 text-danger"
                        : "border-success/40 bg-success/10 text-success"
                    }`}
                  >
                    {initials(record.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base text-card-foreground">{record.email}</p>
                    <div className="mt-1 flex items-center gap-3 font-mono text-xs">
                      <span className="text-warning">$ {Number(record.dollars).toFixed(2)}</span>
                      <span className="text-muted-foreground">{record.devices} dispositivos</span>
                      <span className={record.active ? "text-success" : "text-danger"}>
                        {record.active ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`hidden rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase sm:inline-flex ${
                        record.paid
                          ? "border-success/40 text-success"
                          : "border-danger/40 text-danger"
                      }`}
                    >
                      {record.paid ? "Pago" : "Pendente"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Copiar ${record.email}`}
                      title="Copiar email"
                      className="size-8 text-muted-foreground hover:text-primary"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyEmail(record.email);
                      }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${record.email}`}
                      title="Editar email"
                      className="size-8 text-muted-foreground hover:text-primary"
                      onClick={(event) => {
                        event.stopPropagation();
                        editRecord(record);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <aside className="space-y-6">
          {selected ? (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
                  <AtSign className="size-4" />
                </div>
                <h2 className="text-sm font-bold uppercase">Detalhes da seleção</h2>
              </div>

              <div>
                <span className="detail-label">Email</span>
                <p className="mt-1 break-all font-mono text-sm text-primary">{selected.email}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-b border-border pb-5">
                <div>
                  <span className="detail-label">Valor</span>
                  <p className="mt-1 font-mono text-base text-warning">$ {Number(selected.dollars).toFixed(2)}</p>
                </div>
                <div>
                  <span className="detail-label">Status</span>
                  <button
                    onClick={() => toggleMutation.mutate({ id: selected.id, paid: !selected.paid })}
                    className={`mt-1 block cursor-pointer font-mono text-sm uppercase ${selected.paid ? "text-success" : "text-danger"}`}
                  >
                    {selected.paid ? "Pago" : "Pendente"}
                  </button>
                </div>
              </div>

              <div className="border-b border-border py-5">
                <span className="detail-label">Dispositivos conectados</span>
                <p className="mt-1 font-mono text-base">{selected.devices} unidades</p>
              </div>

              <div className="border-b border-border py-5">
                <span className="detail-label">Situação da conta</span>
                <Button
                  variant="outline"
                  onClick={() => activeMutation.mutate({ id: selected.id, active: !selected.active })}
                  disabled={activeMutation.isPending}
                  className={`mt-2 h-8 rounded-full px-4 font-mono text-xs font-bold uppercase ${
                    selected.active
                      ? "border-success/40 bg-success/10 text-success hover:bg-success/15 hover:text-success"
                      : "border-danger/40 bg-danger/10 text-danger hover:bg-danger/15 hover:text-danger"
                  }`}
                >
                  {selected.active ? "Ativa" : "Inativa"}
                </Button>
              </div>

              <div className="grid grid-cols-[1fr_1fr_40px] gap-2 pt-4">
                <Button variant="secondary" onClick={() => copyEmail(selected.email)} className="h-9 font-mono text-xs">
                  <Copy className="size-3.5" /> Copiar
                </Button>
                <Button variant="secondary" onClick={() => editRecord(selected)} className="h-9 font-mono text-xs">
                  <Pencil className="size-3.5" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Excluir registro"
                  title="Excluir registro"
                  className="size-9 border-danger/50 text-danger hover:bg-danger/10 hover:text-danger"
                  onClick={() => {
                    if (confirm("Remover este registro?")) deleteMutation.mutate(selected.id);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Selecione ou adicione um email.
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-5 text-sm font-bold uppercase">Resumo</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-background p-3">
                <span className="detail-label">Registros</span>
                <p className="mt-1 font-mono text-lg">{records.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <span className="detail-label">Recebido</span>
                <p className="mt-1 font-mono text-lg text-success">$ {totalReceived.toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <span className="detail-label">Ativas</span>
                <p className="mt-1 font-mono text-lg text-primary">{activeCount}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Registros pagos</span>
                <span className="font-mono text-foreground">{paidCount}/{records.length}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${records.length ? (paidCount / records.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </section>
        </aside>
      </div>

      <EmailFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        onSubmit={async (input) => saveMutation.mutateAsync(input)}
      />
    </div>
  );
}