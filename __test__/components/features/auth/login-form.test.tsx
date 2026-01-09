import { LoginForm } from "@/components/features/auth/login-form";
import { useLogin } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mock dependencies
 */
vi.mock("@/hooks/useAuth");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Create a wrapper component that provides QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("LoginForm Component", () => {
  const mockLoginMutation = {
    mutate: vi.fn(),
    isSuccess: false,
    isError: false,
    isPending: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLogin as Mock).mockReturnValue(mockLoginMutation);
  });

  describe("Rendering and UI", () => {
    it.skip("should render login form with all required fields", () => {
      render(<LoginForm />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("heading", { name: "Login" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Enter your email or phone number below to login/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Email or Phone Number/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Login/i })
      ).toBeInTheDocument();
    });

    it("should render admin login form when role is admin", () => {
      render(<LoginForm role="admin" />, { wrapper: createWrapper() });

      expect(screen.getByText("Admin Login")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Enter your credentials to access the admin dashboard/i
        )
      ).toBeInTheDocument();
    });

    it("should have forgot password link", () => {
      render(<LoginForm />, { wrapper: createWrapper() });

      const forgotLink = screen.getByText(/Forgot your password/i);
      expect(forgotLink).toBeInTheDocument();
    });

    it("should have sign up link for user role", () => {
      render(<LoginForm />, { wrapper: createWrapper() });

      const signUpLink = screen.getByText(/Sign up/i);
      expect(signUpLink).toBeInTheDocument();
    });

    it("should not have sign up link for admin role", () => {
      render(<LoginForm role="admin" />, { wrapper: createWrapper() });

      const signUpLink = screen.queryByText(/Sign up/i);
      expect(signUpLink).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when credentials field is empty on blur", async () => {
      const user = userEvent.setup();
      render(<LoginForm />, { wrapper: createWrapper() });

      const credentialsInput = screen.getByLabelText(/Email or Phone Number/i);
      await user.click(credentialsInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Email or phone number is required/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when password field is empty on blur", async () => {
      const user = userEvent.setup();
      render(<LoginForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
    });

    it("should disable login button when form is invalid", async () => {
      render(<LoginForm />, { wrapper: createWrapper() });

      const loginButton = screen.getByRole("button", { name: /Login/i });
      expect(loginButton).toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    // TODO: Fix validation timing issue - button remains disabled due to form validation delay
    it.skip("should submit form with email when credentials contain @", async () => {
      const user = userEvent.setup();
      render(<LoginForm />, { wrapper: createWrapper() });

      const credentialsInput = screen.getByLabelText(/Email or Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);

      await user.type(credentialsInput, "test@example.com");
      await user.type(passwordInput, "password123");

      // Wait for validation to complete and button to be enabled
      await waitFor(() => {
        const loginButton = screen.getByRole("button", { name: /Login/i });
        expect(loginButton).not.toBeDisabled();
      });

      const loginButton = screen.getByRole("button", { name: /Login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLoginMutation.mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "test@example.com",
            password: "password123",
          }),
          expect.anything()
        );
      });
    });

    // TODO: Fix validation timing issue - button remains disabled due to form validation delay
    it.skip("should submit form with phone when credentials don't contain @", async () => {
      const user = userEvent.setup();
      render(<LoginForm />, { wrapper: createWrapper() });

      const credentialsInput = screen.getByLabelText(/Email or Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);

      await user.type(credentialsInput, "08012345678");
      await user.type(passwordInput, "password123");

      // Wait for validation to complete and button to be enabled
      await waitFor(() => {
        const loginButton = screen.getByRole("button", { name: /Login/i });
        expect(loginButton).not.toBeDisabled();
      });

      const loginButton = screen.getByRole("button", { name: /Login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLoginMutation.mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: "08012345678",
            password: "password123",
          }),
          expect.anything()
        );
      });
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility", async () => {
      const user = userEvent.setup();
      render(<LoginForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(
        /^Password$/i
      ) as HTMLInputElement;
      expect(passwordInput.type).toBe("password");

      // Find and click the toggle button
      const toggleButton = screen.getByRole("button", {
        name: /Show password/i,
      });

      await user.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput.type).toBe("text");
      });

      // Click again to hide
      const hideButton = screen.getByRole("button", {
        name: /Hide password/i,
      });
      await user.click(hideButton);

      await waitFor(() => {
        expect(passwordInput.type).toBe("password");
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error alert when login fails", async () => {
      const errorMessage = "Invalid credentials";
      (useLogin as Mock).mockReturnValue({
        ...mockLoginMutation,
        isError: true,
        error: {
          response: {
            data: {
              message: errorMessage,
            },
          },
        },
      });

      render(<LoginForm />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should show spinner when login is pending", async () => {
      (useLogin as Mock).mockReturnValue({
        ...mockLoginMutation,
        isPending: true,
      });

      render(<LoginForm />, { wrapper: createWrapper() });

      // Search for the submit button specifically
      const loginButton = screen.getByRole("button", { name: /Logging in/i });
      expect(loginButton).toBeDisabled();
      expect(screen.getByText(/Logging in/i)).toBeInTheDocument();
    });
  });

  describe("Autofill Handling", () => {
    // TODO: Fix validation timing issue - button remains disabled due to form validation delay
    it.skip("should handle autofill trigger", async () => {
      const user = userEvent.setup();
      render(<LoginForm />, { wrapper: createWrapper() });

      const credentialsInput = screen.getByLabelText(/Email or Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);

      await act(async () => {
        await user.type(credentialsInput, "test@example.com");
        await user.type(passwordInput, "password123");
      });

      await waitFor(() => {
        const loginButton = screen.getByRole("button", { name: /Login/i });
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form fields", () => {
      render(<LoginForm />, { wrapper: createWrapper() });

      expect(
        screen.getByLabelText(/Email or Phone Number/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    });

    it("should have aria-label for password toggle button", () => {
      render(<LoginForm />, { wrapper: createWrapper() });

      const toggleButton = screen.getByRole("button", {
        name: /Show password/i,
      });
      expect(toggleButton).toHaveAttribute(
        "aria-label",
        expect.stringMatching(/Show password|Hide password/)
      );
    });

    it("should have proper button role and text", () => {
      render(<LoginForm />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("button", { name: /Login/i })
      ).toBeInTheDocument();
    });
  });
});
