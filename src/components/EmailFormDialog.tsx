import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmailInput, EmailRecord } from "@/lib/emails";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: EmailRecord | null;
  onSubmit: (input: EmailInput) => Promise<void>;
};

export function EmailFormDialog({ open, onOpenChange, record, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [dollars, setDollars] = useState("0");
  const [devices, setDevices] = useState("0");
  const [paid, setPaid] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(record?.email ?? "");
    setDollars(String(record?.dollars ?? 0));
    setDevices(String(record?.devices ?? 0));
    setPaid(record?.paid ?? false);
    setActive(record?.active ?? true);
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        email: email.trim(),
        dollars: Number(dollars) || 0,
        devices: Number(devices) || 0,
        paid,
        active,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-card-foreground outline-none transition-colors focus:border-primary/60";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold uppercase text-foreground">
            {record ? "Editar registro" : "Novo email"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-caps mb-1 block" htmlFor="f-email">
              Endereço de email
            </label>
            <input
              id="f-email"
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-caps mb-1 block" htmlFor="f-dollars">
                Dólares
              </label>
              <input
                id="f-dollars"
                type="number"
                min={0}
                step="0.01"
                value={dollars}
                onChange={(e) => setDollars(e.target.value)}
                className={`${field} font-mono`}
              />
            </div>
            <div>
              <label className="label-caps mb-1 block" htmlFor="f-devices">
                Dispositivos
              </label>
              <input
                id="f-devices"
                type="number"
                min={0}
                value={devices}
                onChange={(e) => setDevices(e.target.value)}
                className={`${field} font-mono`}
              />
            </div>
          </div>

          <div>
            <span className="label-caps mb-1 block">Status</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaid(true)}
                className={`flex-1 rounded-lg font-mono text-xs font-bold uppercase ${
                  paid
                    ? "border-success/60 bg-success/10 text-success"
                    : "border-border text-muted-foreground"
                }`}
              >
                Pago
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaid(false)}
                className={`flex-1 rounded-lg font-mono text-xs font-bold uppercase ${
                  !paid
                    ? "border-danger/60 bg-danger/10 text-danger"
                    : "border-border text-muted-foreground"
                }`}
              >
                Não pago
              </Button>
            </div>
          </div>

          <div>
            <span className="label-caps mb-1 block">Situação da conta</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActive(true)}
                className={`flex-1 rounded-lg font-mono text-xs font-bold uppercase ${
                  active
                    ? "border-success/60 bg-success/10 text-success"
                    : "border-border text-muted-foreground"
                }`}
              >
                Ativa
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActive(false)}
                className={`flex-1 rounded-lg font-mono text-xs font-bold uppercase ${
                  !active
                    ? "border-danger/60 bg-danger/10 text-danger"
                    : "border-border text-muted-foreground"
                }`}
              >
                Inativa
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg font-bold"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
