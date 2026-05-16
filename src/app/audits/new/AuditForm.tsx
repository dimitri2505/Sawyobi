"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createAudit } from "../actions";

export interface MaterialOption {
  id: number;
  name: string;
  unit: string;
  remaining: number;
}

interface Line {
  key: string;
  materialId: number | "";
  countedQuantity: string;
  systemQuantity: number;
}

function newLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    materialId: "",
    countedQuantity: "",
    systemQuantity: 0,
  };
}

export function AuditForm({ materials }: { materials: MaterialOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function onMaterialChange(idx: number, value: string) {
    const id = value === "" ? "" : Number(value);
    const mat = materials.find((m) => m.id === id);
    updateLine(idx, {
      materialId: id,
      systemQuantity: mat ? mat.remaining : 0,
    });
  }

  function addAllMaterials() {
    setLines(
      materials.map((m) => ({
        key: Math.random().toString(36).slice(2),
        materialId: m.id,
        countedQuantity: "",
        systemQuantity: m.remaining,
      })),
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const valid = lines.filter(
      (l) => l.materialId !== "" && l.countedQuantity !== "",
    );
    if (valid.length === 0) {
      setError("მინიმუმ ერთი ჩანაწერი საჭიროა");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set(
      "items",
      JSON.stringify(
        valid.map((l) => ({
          materialId: Number(l.materialId),
          countedQuantity: Number(l.countedQuantity),
          systemQuantity: Number(l.systemQuantity),
        })),
      ),
    );
    startTransition(async () => {
      try {
        await createAudit(fd);
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
      <div className="card grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="auditedAt">თარიღი</label>
          <input
            id="auditedAt"
            name="auditedAt"
            type="date"
            defaultValue={today}
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label htmlFor="notes">შენიშვნა</label>
          <input id="notes" name="notes" className="mt-1 w-full" />
        </div>
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">დათვლილი მასალები</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addAllMaterials}
              className="btn-secondary"
            >
              ყველა მასალის ჩატვირთვა
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
        <div className="max-h-[60vh] overflow-y-auto">
          <table>
            <thead className="sticky top-0 bg-card">
              <tr>
                <th className="w-1/2">მასალა</th>
                <th>ერთეული</th>
                <th className="text-right">სისტემური</th>
                <th className="text-right">დათვლილი</th>
                <th className="text-right">სხვაობა</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const mat = materials.find((m) => m.id === line.materialId);
                const variance =
                  Number(line.countedQuantity) - Number(line.systemQuantity);
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
                    <td className="text-right tabular-nums">
                      {line.systemQuantity}
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={line.countedQuantity}
                        onChange={(e) =>
                          updateLine(idx, { countedQuantity: e.target.value })
                        }
                        required
                        className="w-full text-right tabular-nums"
                      />
                    </td>
                    <td className="text-right tabular-nums">
                      {line.countedQuantity === "" ? (
                        "—"
                      ) : (
                        <span
                          className={
                            variance < 0
                              ? "text-destructive"
                              : variance > 0
                                ? "text-emerald-600"
                                : ""
                          }
                        >
                          {variance.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setLines((p) => p.filter((_, i) => i !== idx))
                          }
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
