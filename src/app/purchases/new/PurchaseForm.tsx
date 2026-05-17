"use client";

import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ListPlus, Search, X } from "lucide-react";
import { createPurchase } from "../actions";
import { PURCHASE_CATEGORIES, PURCHASE_PROJECTS } from "@/lib/categories";

export interface MaterialOption {
  id: number;
  name: string;
  unit: string;
  defaultUnitPrice: string | null;
  lastPrice: string | null;
}

interface Line {
  key: string;
  project: string;
  category: string;
  materialId: number | "";
  quantity: string;
  unitPrice: string;
}

function newLine(mat?: MaterialOption): Line {
  return {
    key: Math.random().toString(36).slice(2),
    project: "",
    category: "",
    materialId: mat ? mat.id : "",
    quantity: "",
    unitPrice: mat?.defaultUnitPrice ?? "",
  };
}

function BulkPickerModal({
  materials,
  onConfirm,
  onClose,
}: {
  materials: MaterialOption[];
  onConfirm: (selected: MaterialOption[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? materials.filter((m) => m.name.toLowerCase().includes(q)) : materials;
  }, [materials, search]);

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (filtered.every((m) => checked.has(m.id))) {
      setChecked((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setChecked((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.add(m.id));
        return next;
      });
    }
  }

  function confirm() {
    const selected = materials.filter((m) => checked.has(m.id));
    onConfirm(selected);
  }

  const allChecked = filtered.length > 0 && filtered.every((m) => checked.has(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[80vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">მასალების არჩევა</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* search */}
        <div className="border-b border-border px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ძებნა..."
              className="w-full pl-8"
            />
          </div>
        </div>

        {/* select all row */}
        <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2 text-sm">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer"
          />
          <span className="text-muted-foreground">
            {checked.size > 0 ? `${checked.size} არჩეულია` : "ყველა"}
          </span>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={checked.has(m.id)}
                onChange={() => toggle(m.id)}
                className="h-4 w-4"
              />
              <span className="flex-1 text-sm">{m.name}</span>
              <span className="text-xs text-muted-foreground">{m.unit}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              ვერ მოიძებნა
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {checked.size} მასალა არჩეულია
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              გაუქმება
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={checked.size === 0}
              className="btn"
            >
              დამატება ({checked.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PurchaseForm({ materials }: { materials: MaterialOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

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

  function onBulkConfirm(selected: MaterialOption[]) {
    setShowPicker(false);
    if (selected.length === 0) return;
    // remove empty placeholder lines, then append selected
    setLines((prev) => {
      const nonEmpty = prev.filter(
        (l) => l.materialId !== "" || l.quantity !== "",
      );
      const incoming = selected.map((m) => newLine(m));
      return nonEmpty.length > 0 ? [...nonEmpty, ...incoming] : incoming;
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
          project: l.project || null,
          category: l.category || null,
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
    <>
      {showPicker && (
        <BulkPickerModal
          materials={materials}
          onConfirm={onBulkConfirm}
          onClose={() => setShowPicker(false)}
        />
      )}

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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="btn-secondary"
              >
                <ListPlus className="h-4 w-4" />
                მასალების არჩევა
              </button>
              <button
                type="button"
                onClick={() => setLines((p) => [...p, newLine()])}
                className="btn-secondary"
              >
                <Plus className="h-4 w-4" />
                სტრიქონი
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="w-40">პროექტი</th>
                  <th className="w-40">კატეგორია</th>
                  <th>მასალა</th>
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
                  const sum = Number(line.quantity) * Number(line.unitPrice || 0);
                  return (
                    <tr key={line.key}>
                      <td>
                        <select
                          value={line.project}
                          onChange={(e) => updateLine(idx, { project: e.target.value })}
                          className="w-full"
                        >
                          <option value="">— პროექტი —</option>
                          {PURCHASE_PROJECTS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={line.category}
                          onChange={(e) => updateLine(idx, { category: e.target.value })}
                          className="w-full"
                        >
                          <option value="">— კატეგორია —</option>
                          {PURCHASE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={line.materialId}
                          onChange={(e) => onMaterialChange(idx, e.target.value)}
                          required
                          className="w-full"
                        >
                          <option value="">— მასალა —</option>
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
                          onChange={(e) => updateLine(idx, { quantity: e.target.value })}
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
                          onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                          className="w-full text-right tabular-nums"
                        />
                        {(() => {
                          const last = mat?.lastPrice ? Number(mat.lastPrice) : null;
                          const cur = Number(line.unitPrice);
                          if (!last || !cur || last === 0) return null;
                          const pct = ((cur - last) / last) * 100;
                          if (Math.abs(pct) < 10) return null;
                          return (
                            <div className={`mt-0.5 text-xs ${pct > 0 ? "text-destructive" : "text-emerald-700"}`}>
                              {pct > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% ბოლო ფასთან
                            </div>
                          );
                        })()}
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
                  <td colSpan={6} className="text-right font-medium">
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
    </>
  );
}
