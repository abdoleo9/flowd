import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Logo & branding */}
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Flowd" className="h-16 w-16 mx-auto mb-4 object-contain" />
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
