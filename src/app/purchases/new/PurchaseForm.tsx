"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createPurchase } from "../actions";

export interface MaterialOption {
  id: number;
  name: string;
  unit: string;
  defaultUnitPrice: string | null;
}

interface Line {
  key: string;
  materialId: number | "";
  quantity: string;
  unitPrice: string;
}

function newLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    materialId: "",
    quantity: "",
    unitPrice: "",
  };
}

export function PurchaseForm({ materials }: { materials: MaterialOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const total = lines.reduce((sum, l) => {
    const q = Number(l.quantity);
    const p = Number(l.unitPrice);
    if (Number.isFinite(q) && Number.isFinite(p)) return sum + q * p;
    return sum;
  }, 0);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function onMaterialChange(idx: number, value: string) {
    const id = value === "" ? "" : Number(value);
    const mat = materials.find((m) => m.id === id);
    updateLine(idx, {
      materialId: id,
      unitPrice:
        mat?.defaultUnitPrice && lines[idx].unitPrice === ""
          ? mat.defaultUnitPrice
          : lines[idx].unitPrice,
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const valid = lines.filter(
      (l) => l.materialId !== "" && Number(l.quantity) > 0,
    );
    if (valid.length === 0) {
      setError("მინიმუმ ერთი მასალა საჭიროა");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set(
      "items",
      JSON.stringify(
        valid.map((l) => ({
          materialId: Number(l.materialId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice || 0),
        })),
      ),
    );
    startTransition(async () => {
      try {
        await createPurchase(fd);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "შეცდომა";
        if (!msg.includes("NEXT_REDIRECT")) setError(msg);
      } finally {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="card grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <label htmlFor="purchasedAt">თარიღი</label>
          <input
            id="purchasedAt"
            name="purchasedAt"
            type="date"
            defaultValue={today}
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label htmlFor="supplier">მომწოდებელი</label>
          <input id="supplier" name="supplier" className="mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="invoiceNo">ინვოისი</label>
          <input id="invoiceNo" name="invoiceNo" className="mt-1 w-full" />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="notes">შენიშვნა</label>
          <input id="notes" name="notes" className="mt-1 w-full" />
        </div>
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">მასალის სტრიქონები</h2>
          <button type="button" onClick={addLine} className="btn-secondary">
            <Plus className="h-4 w-4" />
            სტრიქონი
          </button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="w-1/2">მასალა</th>
                <th>ერთეული</th>
                <th className="text-right">რაოდენობა</th>
                <th className="text-right">ერთ. ფასი</th>
                <th className="text-right">ჯამი</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const mat = materials.find((m) => m.id === line.materialId);
                const sum =
                  Number(line.quantity) * Number(line.unitPrice || 0);
                return (
                  <tr key={line.key}>
                    <td>
                      <select
                        value={line.materialId}
                        onChange={(e) => onMaterialChange(idx, e.target.value)}
                        required
                        className="w-full"
                      >
                        <option value="">— აირჩიე მასალა —</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-muted-foreground">{mat?.unit ?? "—"}</td>
                    <td>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, { quantity: e.target.value })
                        }
                        required
                        className="w-full text-right tabular-nums"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, { unitPrice: e.target.value })
                        }
                        className="w-full text-right tabular-nums"
                      />
                    </td>
                    <td className="text-right tabular-nums">
                      {Number.isFinite(sum) ? sum.toFixed(2) : "—"}
                    </td>
                    <td>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="btn-ghost text-destructive"
                          aria-label="წაშლა"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="text-right font-medium">
                  სულ:
                </td>
                <td className="text-right font-semibold tabular-nums">
                  {total.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-red-50 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending} className="btn">
          {isPending ? "ინახება…" : "შენახვა"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          გაუქმება
        </button>
      </div>
    </form>
  );
}
