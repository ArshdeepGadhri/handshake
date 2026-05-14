import { redirect } from 'next/navigation';

export default function Home() {
  // For MVP, redirect straight to contacts dashboard
  redirect('/contacts');
}
