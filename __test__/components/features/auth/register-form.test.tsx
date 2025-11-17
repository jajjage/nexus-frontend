import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RegisterForm } from "@/components/features/auth/register-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the auth hooks
const mockRegisterMutation = jest.fn();
const mockUseRegister = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useRegister: () => mockUseRegister(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("RegisterForm", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockRegisterMutation.mockClear();
    mockUseRegister.mockClear();

    // Set default mock return value
    mockUseRegister.mockReturnValue({
      mutate: mockRegisterMutation,
    });
  });

  it("renders the register form with all elements", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm />
      </QueryClientProvider>
    );
    expect(
      screen.getByRole("heading", { name: /sign up/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/enter your information to create an account/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create an account/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
  });

  it("shows an error if phone number is empty on blur", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm />
      </QueryClientProvider>
    );
    const phoneNumberInput = screen.getByLabelText(/phone number/i);
    fireEvent.blur(phoneNumberInput);

    await waitFor(() => {
      expect(screen.getByText("Phone number is required")).toBeInTheDocument();
    });
  });

  it("shows an error for invalid phone number length", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm />
      </QueryClientProvider>
    );
    const phoneNumberInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneNumberInput, { target: { value: "12345" } });

    await waitFor(() => {
      expect(
        screen.getByText("Phone number must be between 11 and 14 digits")
      ).toBeInTheDocument();
    });
  });

  it("accepts a valid 11-digit phone number", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm />
      </QueryClientProvider>
    );
    const phoneNumberInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneNumberInput, { target: { value: "12345678901" } });

    await waitFor(() => {
      expect(
        screen.queryByText("Phone number must be between 11 and 14 digits")
      ).not.toBeInTheDocument();
    });
  });

  it("accepts a valid 14-digit phone number", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm />
      </QueryClientProvider>
    );
    const phoneNumberInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneNumberInput, { target: { value: "12345678901234" } });

    await waitFor(() => {
      expect(
        screen.queryByText("Phone number must be between 11 and 14 digits")
      ).not.toBeInTheDocument();
    });
  });

  it("accepts a formatted phone number with 11 digits", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm />
      </QueryClientProvider>
    );
    const phoneNumberInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneNumberInput, {
      target: { value: "+1 (234) 567-8901" },
    }); // 11 digits

    await waitFor(() => {
      expect(
        screen.queryByText("Phone number must be between 11 and 14 digits")
      ).not.toBeInTheDocument();
    });
  });
});
