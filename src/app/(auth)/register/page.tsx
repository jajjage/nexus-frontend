import { RegisterForm } from "@/components/features/auth/register-form";
import { Footer } from "@/components/landing-page/footer";
import { Header } from "@/components/landing-page/header";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Spinner className="text-primary size-8" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
