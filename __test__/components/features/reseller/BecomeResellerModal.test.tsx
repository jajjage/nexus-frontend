import { BecomeResellerModal } from "@/components/features/reseller/BecomeResellerModal";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Mock the auth context
vi.mock("@/context/AuthContext", () => ({
  useAuthContext: vi.fn(() => ({
    user: {
      userId: "user-123",
      fullName: "Test User",
      email: "test@example.com",
      phoneNumber: "08012345678",
      role: "user",
    },
  })),
}));

// Mock the reseller hook
const mockSubmitRequest = vi.fn();
vi.mock("@/hooks/useReseller", () => ({
  useRequestResellerUpgrade: vi.fn(() => ({
    mutate: mockSubmitRequest,
    isPending: false,
  })),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("BecomeResellerModal", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (open = true) => {
    return render(
      <BecomeResellerModal open={open} onOpenChange={mockOnOpenChange} />
    );
  };

  describe("Rendering", () => {
    it("should not render when open is false", () => {
      renderModal(false);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render modal when open is true", () => {
      renderModal(true);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should display the headline", () => {
      renderModal();
      expect(
        screen.getByText("Unlock Exclusive Wholesale Rates")
      ).toBeInTheDocument();
    });

    it("should display all benefit cards", () => {
      renderModal();
      expect(screen.getByText("Massive Discounts")).toBeInTheDocument();
      expect(screen.getByText("Bulk Tools")).toBeInTheDocument();
      expect(screen.getByText("API Access")).toBeInTheDocument();
      expect(screen.getByText("Priority Support")).toBeInTheDocument();
    });

    it("should display user information", () => {
      renderModal();
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it("should display message textarea", () => {
      renderModal();
      expect(
        screen.getByPlaceholderText(/I run a cyber cafe/i)
      ).toBeInTheDocument();
    });

    it("should have submit button disabled initially", () => {
      renderModal();
      const submitButton = screen.getByRole("button", {
        name: /Submit Application/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Form Interaction", () => {
    it("should enable submit button when message is entered", () => {
      renderModal();
      const textarea = screen.getByPlaceholderText(/I run a cyber cafe/i);
      fireEvent.change(textarea, {
        target: { value: "I want to become a reseller" },
      });

      const submitButton = screen.getByRole("button", {
        name: /Submit Application/i,
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("should call submitRequest when form is submitted", async () => {
      renderModal();
      const textarea = screen.getByPlaceholderText(/I run a cyber cafe/i);
      fireEvent.change(textarea, {
        target: { value: "I want to become a reseller" },
      });

      const submitButton = screen.getByRole("button", {
        name: /Submit Application/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitRequest).toHaveBeenCalledWith(
          "I want to become a reseller",
          expect.any(Object)
        );
      });
    });

    it("should not submit with empty message", () => {
      renderModal();
      const textarea = screen.getByPlaceholderText(/I run a cyber cafe/i);
      fireEvent.change(textarea, { target: { value: "   " } }); // whitespace only

      const submitButton = screen.getByRole("button", {
        name: /Submit Application/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Success State", () => {
    it("should show success state after submission", async () => {
      // Mock successful submission
      mockSubmitRequest.mockImplementation((message, options) => {
        options?.onSuccess?.();
      });

      renderModal();
      const textarea = screen.getByPlaceholderText(/I run a cyber cafe/i);
      fireEvent.change(textarea, {
        target: { value: "I want to become a reseller" },
      });

      const submitButton = screen.getByRole("button", {
        name: /Submit Application/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Application Submitted!")).toBeInTheDocument();
      });
    });

    it("should have 'Got it' button in success state", async () => {
      mockSubmitRequest.mockImplementation((message, options) => {
        options?.onSuccess?.();
      });

      renderModal();
      const textarea = screen.getByPlaceholderText(/I run a cyber cafe/i);
      fireEvent.change(textarea, {
        target: { value: "I want to become a reseller" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Submit Application/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Got it/i })
        ).toBeInTheDocument();
      });
    });
  });
});
