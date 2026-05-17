"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createIssue } from "../actions";
import { PURCHASE_CATEGORIES, PURCHASE_PROJECTS } from "@/lib/categories";

export interface MaterialOption {
  id: number;
  name: string;
  unit: string;
  remaining: number;
}

export interface SegmentOption {
  id: number;
  code: string | null;
  name: string;
  parentId: number | null;
}

interface Line {
  key: string;
  project: string;
  category: string;
  materialId: number | "";
  quantity: string;
}

function newLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    project: "",
    category: "",
    materialId: "",
    quantity: "",
  };
}

export function IssueForm({
  materials,
  segmentOptions,
}: {
  materials: MaterialOption[];
  segmentOptions: SegmentOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
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
    for (const l of valid) {
      const mat = materials.find((m) => m.id === l.materialId);
      if (mat && Number(l.quantity) > mat.remaining) {
        setError(
          `"${mat.name}" — საწყობში არის მხოლოდ ${mat.remaining} ${mat.unit}`,
        );
        return;
      }
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
        })),
      ),
    );
    startTransition(async () => {
      try {
        await createIssue(fd);
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
        <div>
          <label htmlFor="issuedAt">თარიღი</label>
          <input
            id="issuedAt"
            name="issuedAt"
            type="date"
            defaultValue={today}
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label htmlFor="segmentId">სეგმენტი / პროექტის ნაწილი</label>
          <select id="segmentId" name="segmentId" className="mt-1 w-full">
            <option value="">— არჩევითი —</option>
            {segmentOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code ? `${s.code} ` : ""}
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="issuedBy">გამცემი</label>
          <input id="issuedBy" name="issuedBy" className="mt-1 w-full" />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="notes">შენიშვნა</label>
          <input id="notes" name="notes" className="mt-1 w-full" />
        </div>
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">გასატანი მასალები</h2>
          <button
            type="button"
            onClick={() => setLines((p) => [...p, newLine()])}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4" />
            სტრიქონი
          </button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="w-40">პროექტი</th>
                <th className="w-40">კატეგორია</th>
                <th>მასალა</th>
                <th>ერთეული</th>
                <th className="text-right">საწყობში</th>
                <th className="text-right">გასატანი რაოდ.</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const mat = materials.find((m) => m.id === line.materialId);
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
                        onChange={(e) =>
                          updateLine(idx, {
                            materialId:
                              e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                        required
                        className="w-full"
                      >
                        <option value="">— აირჩიე მასალა —</option>
                        {materials.map((m) => (
                          <option
                            key={m.id}
                            value={m.id}
                            disabled={m.remaining <= 0}
                          >
                            {m.name}
                            {m.remaining <= 0 ? " (0)" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-muted-foreground">{mat?.unit ?? "—"}</td>
                    <td className="text-right tabular-nums">
                      {mat ? mat.remaining : "—"}
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        max={mat?.remaining ?? undefined}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, { quantity: e.target.value })
                        }
                        required
                        className="w-full text-right tabular-nums"
                      />
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
          {isPending ? "ინახება…" : "გატანა"}
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
