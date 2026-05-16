import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "საწყობი — სახლი #2",
    template: "%s | საწყობი",
  },
  description:
    "საწყობის მართვის სისტემა სამშენებლო პროექტისთვის — სახლი #2.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ka">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
