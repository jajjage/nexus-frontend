import { LoginForm } from "@/components/features/auth/login-form";
import { Footer } from "@/components/features/dashboard/landing-page/footer";
import { Header } from "@/components/features/dashboard/landing-page/header";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-12">
        <LoginForm role="admin" />
      </main>
      <Footer />
    </>
  );
}
