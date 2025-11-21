import { RegisterForm } from "@/components/features/auth/register-form";
import { useRegister } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/**
 * Mock dependencies
 */
jest.mock("@/hooks/useAuth");
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
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
    mutate: jest.fn(),
    isSuccess: false,
    isError: false,
    isSubmitting: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRegister as jest.Mock).mockReturnValue(mockRegisterMutation);
  });

  describe("Rendering and UI", () => {
    it("should render register form with all required fields", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(screen.getByText("Sign Up")).toBeInTheDocument();
      expect(
        screen.getByText(/Enter your information to create an account/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Create an account/i })
      ).toBeInTheDocument();
    });

    it("should have login link", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const loginLink = screen.getByText(/Login/i);
      expect(loginLink).toBeInTheDocument();
    });
  });

  describe("Form Validation - Full Name", () => {
    it("should show error when name is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/Name/i);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it("should accept valid full name", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/Name/i);
      await user.type(nameInput, "John Doe");

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Validation - Email", () => {
    it("should show error when email is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText(/^Email$/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid email address|Email is required/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when email is invalid", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText(/^Email$/i);
      await user.type(emailInput, "invalid-email");

      await waitFor(() => {
        expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
      });
    });

    it("should accept valid email", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText(/^Email$/i);
      await user.type(emailInput, "test@example.com");

      await waitFor(() => {
        expect(
          screen.queryByText(/Invalid email address/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Validation - Phone Number", () => {
    it("should show error when phone is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.click(phoneInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number is required/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when phone is too short", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.type(phoneInput, "123");

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number must be between 11 and 14 digits/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when phone is too long", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.type(phoneInput, "123456789012345");

      await waitFor(() => {
        expect(
          screen.getByText(/Phone number must be between 11 and 14 digits/i)
        ).toBeInTheDocument();
      });
    });

    it("should accept valid phone number", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.type(phoneInput, "08012345678");

      await waitFor(() => {
        expect(
          screen.queryByText(/Phone number must be between 11 and 14 digits/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Validation - Password", () => {
    it("should show error when password is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 8 characters long/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when password is too short", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.type(passwordInput, "Pass1!");

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 8 characters long/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when password missing uppercase", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.type(passwordInput, "password1!");

      await waitFor(() => {
        expect(
          screen.getByText(
            /Password must contain at least one uppercase letter/i
          )
        ).toBeInTheDocument();
      });
    });

    it("should show error when password missing lowercase", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.type(passwordInput, "PASSWORD1!");

      await waitFor(() => {
        expect(
          screen.getByText(
            /Password must contain at least one lowercase letter/i
          )
        ).toBeInTheDocument();
      });
    });

    it("should show error when password missing number", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.type(passwordInput, "Password!");

      await waitFor(() => {
        expect(
          screen.getByText(/Password must contain at least one number/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when password missing special character", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.type(passwordInput, "Password1");

      await waitFor(() => {
        expect(
          screen.getByText(
            /Password must contain at least one special character/i
          )
        ).toBeInTheDocument();
      });
    });

    it("should accept valid password", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      await user.type(passwordInput, "ValidPass123!");

      await waitFor(() => {
        expect(
          screen.queryByText(
            /Password must be at least 8 characters|uppercase|lowercase|number|special character/i
          )
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Validation - Confirm Password", () => {
    it("should show error when confirm password doesn't match", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(passwordInput, "ValidPass123!");
      await user.type(confirmInput, "DifferentPass123!");

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it("should accept when passwords match", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(passwordInput, "ValidPass123!");
      await user.type(confirmInput, "ValidPass123!");

      await waitFor(() => {
        expect(
          screen.queryByText(/Passwords do not match/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should disable submit button when form is invalid", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole("button", {
        name: /Create an account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when form is valid", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/Name/i);
      const emailInput = screen.getByLabelText(/^Email$/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(phoneInput, "08012345678");
      await user.type(passwordInput, "ValidPass123!");
      await user.type(confirmInput, "ValidPass123!");

      const submitButton = screen.getByRole("button", {
        name: /Create an account/i,
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("should submit form with correct payload", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/Name/i);
      const emailInput = screen.getByLabelText(/^Email$/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(phoneInput, "08012345678");
      await user.type(passwordInput, "ValidPass123!");
      await user.type(confirmInput, "ValidPass123!");

      const submitButton = screen.getByRole("button", {
        name: /Create an account/i,
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegisterMutation.mutate).toHaveBeenCalledWith({
          fullName: "John Doe",
          email: "john@example.com",
          phoneNumber: "08012345678",
          password: "ValidPass123!",
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when registration fails", async () => {
      const errorMessage = "Email already exists";
      (useRegister as jest.Mock).mockReturnValue({
        ...mockRegisterMutation,
        isError: true,
        error: {
          response: {
            data: {
              message: errorMessage,
            },
          },
        },
      });

      render(<RegisterForm />, { wrapper: createWrapper() });

      // Fill form first
      const user = userEvent.setup();
      const nameInput = screen.getByLabelText(/Name/i);
      const emailInput = screen.getByLabelText(/^Email$/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(phoneInput, "08012345678");
      await user.type(passwordInput, "ValidPass123!");
      await user.type(confirmInput, "ValidPass123!");

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should show loading state when form is submitting", async () => {
      (useRegister as jest.Mock).mockReturnValue({
        ...mockRegisterMutation,
        isSubmitting: true,
      });

      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/Name/i);
      const emailInput = screen.getByLabelText(/^Email$/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(phoneInput, "08012345678");
      await user.type(passwordInput, "ValidPass123!");
      await user.type(confirmInput, "ValidPass123!");

      const submitButton = screen.getByRole("button", {
        name: /Creating account|Create an account/i,
      });

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all form fields", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    });

    it("should have proper button role and text", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("button", { name: /Create an account/i })
      ).toBeInTheDocument();
    });

    it("should have proper form structure with heading", () => {
      render(<RegisterForm />, { wrapper: createWrapper() });

      const heading = screen.getByText("Sign Up");
      expect(heading).toBeInTheDocument();
    });
  });

  describe("Phone Number Formatting", () => {
    it("should strip non-numeric characters from phone number", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.type(phoneInput, "+234-801-234-5678");

      // The form should accept this and strip it to 11 digits
      const nameInput = screen.getByLabelText(/Name/i);
      const emailInput = screen.getByLabelText(/^Email$/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "ValidPass123!");
      await user.type(confirmInput, "ValidPass123!");

      const submitButton = screen.getByRole("button", {
        name: /Create an account/i,
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});
