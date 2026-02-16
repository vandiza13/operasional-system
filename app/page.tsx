import { redirect } from 'next/navigation';

export default function HomePage() {
  // Langsung lempar pengunjung ke halaman login
  redirect('/login');
}