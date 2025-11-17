import { Header } from "@/components/landing-page/header";
import { LoginForm } from "@/components/features/auth/login-form";
import { Footer } from "@/components/landing-page/footer";

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
