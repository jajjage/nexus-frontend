import { RegisterForm } from "@/components/features/auth/register-form";
import { useRegister } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

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

describe("RegisterForm Component", () => {
  const mockRegisterMutation = {
    mutate: vi.fn(),
    isSuccess: false,
    isError: false,
    isPending: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRegister as vi.Mock).mockReturnValue(mockRegisterMutation);
  });

  describe("Rendering and UI", () => {
    it("should render register form with all required fields", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(screen.getByText("Sign Up")).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when password is too short", async () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: "short" } });
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 8 characters long/i)
        ).toBeInTheDocument();
      });
    });

    it("should accept valid email", async () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText(/^Email$/i);
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/Invalid email address/i)
        ).not.toBeInTheDocument();
      });
    });

    it("should show error when phone is too short", async () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await act(async () => {
        fireEvent.change(phoneInput, { target: { value: "123" } });
        fireEvent.blur(phoneInput);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number must be between 11 and 14 digits/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit form with correct payload", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/Name/i);
      const emailInput = screen.getByLabelText(/^Email$/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await act(async () => {
        await user.type(nameInput, "John Doe");
        await user.type(emailInput, "john@example.com");
        await user.type(phoneInput, "08012345678");
        await user.type(passwordInput, "ValidPass123!");
        await user.type(confirmInput, "ValidPass123!");
      });

      const submitButton = screen.getByRole("button", {
        name: /Create an account/i,
      });

      await waitFor(
        () => {
          expect(submitButton).not.toBeDisabled();
        },
        { timeout: 10000 }
      );

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRegisterMutation.mutate).toHaveBeenCalledWith({
          fullName: "John Doe",
          email: "john@example.com",
          phoneNumber: "08012345678",
          password: "ValidPass123!",
          referralCode: "",
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should show loading state when form is submitting", async () => {
      (useRegister as vi.Mock).mockReturnValue({
        ...mockRegisterMutation,
        isPending: true,
      });

      render(<RegisterForm />, { wrapper: createWrapper() });

      const loadingText = screen.getByText(/Creating account/i);
      expect(loadingText).toBeInTheDocument();

      const submitButton = screen.getByRole("button", {
        name: /Creating account/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });
});
