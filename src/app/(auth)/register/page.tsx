import { Header } from "@/components/landing-page/header";
import { RegisterForm } from "@/components/features/auth/register-form";
import { Footer } from "@/components/landing-page/footer";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-12">
        <RegisterForm />
      </main>
      <Footer />
    </>
  );
}
