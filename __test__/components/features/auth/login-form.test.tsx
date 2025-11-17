import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LoginForm } from "@/components/features/auth/login-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the auth hooks
const mockLoginMutation = jest.fn();
const mockUseLogin = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useLogin: () => mockUseLogin(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("LoginForm", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockLoginMutation.mockClear();
    mockUseLogin.mockClear();
  });

  const renderComponent = (loginHookValue: any) => {
    mockUseLogin.mockReturnValue({
      mutate: mockLoginMutation,
      isPending: false,
      isError: false,
      error: null,
      ...loginHookValue,
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <LoginForm />
      </QueryClientProvider>
    );
  };

  it("renders the login form with all elements", () => {
    renderComponent({});
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(
      screen.getByText(/enter your email or phone number below/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email or phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /forgot your password/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields on blur", async () => {
    renderComponent({});
    fireEvent.blur(screen.getByLabelText(/email or phone number/i));
    fireEvent.blur(screen.getByLabelText(/password/i));

    await waitFor(() => {
      expect(
        screen.getByText("Email or phone number is required")
      ).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("disables the submit button when form is invalid", () => {
    renderComponent({});
    expect(screen.getByRole("button", { name: /login/i })).toBeDisabled();
  });

  it("enables the submit button when form is valid", async () => {
    renderComponent({});
    fireEvent.change(screen.getByLabelText(/email or phone number/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /login/i })).toBeEnabled();
    });
  });

  it("calls the login mutation with email on submit", async () => {
    renderComponent({});
    const credentialsInput = screen.getByLabelText(/email or phone number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(credentialsInput, {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLoginMutation).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("calls the login mutation with phone on submit", async () => {
    renderComponent({});
    const credentialsInput = screen.getByLabelText(/email or phone number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(credentialsInput, { target: { value: "08012345678" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLoginMutation).toHaveBeenCalledWith({
        phone: "08012345678",
        password: "password123",
      });
    });
  });

  it("shows a loading spinner and disables button when submitting", () => {
    renderComponent({ isPending: true });

    // Fill form to enable button initially
    fireEvent.change(screen.getByLabelText(/email or phone number/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    const submitButton = screen.getByRole("button", { name: /logging in.../i });
    expect(submitButton).toBeInTheDocument();
    expect(screen.getByText(/logging in.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("displays an error message on login failure", () => {
    const error = {
      response: { data: { message: "Invalid credentials" } },
    } as AxiosError<any>;

    renderComponent({ isError: true, error });

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });
});
