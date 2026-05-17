import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";
import { Noto_Sans_Georgian } from "next/font/google";

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-georgian",
});

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
    <html lang="ka" className={notoSansGeorgian.variable}>
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
