import AIAssistant from '@/components/AIAssistant';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Navbar */}
      <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto relative z-10">
        <div className="text-2xl font-bold tracking-tight">Aradhya <span className="text-rose-500">AI</span></div>
        <Link href="/dashboard" className="px-6 py-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors font-medium">
          Admin Login
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-12 items-center relative z-10 min-h-[80vh]">
        
        {/* Centered AI Assistant Component */}
        <div className="flex justify-center w-full col-span-1 md:col-span-2">
          <AIAssistant />
        </div>

      </div>
    </main>
  );
}
