import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Operasional - Manajemen Reimbursement",
  description: "Platform internal untuk manajemen klaim biaya operasional dan reimbursement karyawan",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" /> {/* [BARU] Notifikasi muncul di kanan atas */}
        {children}
      </body>
    </html>
  );
}