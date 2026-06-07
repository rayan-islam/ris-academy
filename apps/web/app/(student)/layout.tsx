import { Navbar } from '@/components/layout/navbar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16 pb-8 px-4 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
