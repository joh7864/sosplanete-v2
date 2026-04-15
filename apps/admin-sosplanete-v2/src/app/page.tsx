import { LoginForm } from "@/components/auth/LoginForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)] overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-mint)] blur-[120px] opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-sky)] blur-[120px] opacity-40 animate-pulse" />
      
      <LoginForm />
      
      {/* Footer info */}
      <footer className="absolute bottom-8 text-slate-400 text-sm font-medium">
        © 2025 SOS Planète — Ensemble pour demain
      </footer>
    </main>
  );
}
