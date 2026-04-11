import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Logo & branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-xl mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill="white"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Flowd</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestion e-commerce algérien
        </p>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
