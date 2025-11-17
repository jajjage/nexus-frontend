"use client";

import { useState } from "react";
import { useForgotPassword } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const forgotPasswordMutation = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate({ email });
  };

  if (forgotPasswordMutation.isSuccess) {
    return <div>Check your email for reset instructions!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit" disabled={forgotPasswordMutation.isPending}>
        {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
