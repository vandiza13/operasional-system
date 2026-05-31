import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import RegisterSW from './components/RegisterSW';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e40af',
};

export const metadata: Metadata = {
  title: "OPS Reimbursement",
  description: "Platform internal untuk manajemen klaim biaya operasional dan reimbursement karyawan",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OPS Reimbursement',
  },
  formatDetection: {
    telephone: false,
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <RegisterSW />
        <Toaster position="top-right" /> {/* [BARU] Notifikasi muncul di kanan atas */}
        {children}
      </body>
    </html>
  );
}