"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  PackageMinus,
  ClipboardCheck,
  Hammer,
  Wrench,
  Users,
  ListTree,
  Warehouse,
} from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "მთავარი",
    items: [
      { href: "/", label: "დაფა", icon: LayoutDashboard },
      { href: "/balance", label: "ბალანსი", icon: Boxes },
    ],
  },
  {
    title: "ოპერაციები",
    items: [
      { href: "/purchases", label: "შეძენები", icon: ShoppingCart },
      { href: "/issues", label: "გატანები", icon: PackageMinus },
      { href: "/audits", label: "რევიზია", icon: ClipboardCheck },
    ],
  },
  {
    title: "გეგმა",
    items: [{ href: "/budget", label: "ბიუჯეტი", icon: ListTree }],
  },
  {
    title: "კატალოგი",
    items: [
      { href: "/catalog/materials", label: "მასალები", icon: Hammer },
      { href: "/catalog/services", label: "მომსახურება", icon: Wrench },
      { href: "/catalog/labor", label: "ხელფასები", icon: Users },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Warehouse className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold">საწყობი</div>
          <div className="text-xs text-muted-foreground">სახლი #2</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <div className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {g.title}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active =
                  it.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(it.href);
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        ქ. თბილისი, უნივერსიტეტის ქუჩა
      </div>
    </aside>
  );
}
