import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { verificationService } from "@/services/verification.service";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/services/verification.service");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockVerificationService = verificationService as jest.Mocked<
  typeof verificationService
>;

describe("PinVerificationModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (overrides = {}) => {
    const defaultProps = {
      open: true,
      onClose: mockOnClose,
      onSuccess: mockOnSuccess,
      reason: "transaction" as const,
      transactionAmount: "1000",
      productCode: "airtime-500",
      phoneNumber: "08012345678",
      ...overrides,
    };

    return render(<PinVerificationModal {...defaultProps} />);
  };

  describe("Rendering", () => {
    it("should not render when open is false", () => {
      renderModal({ open: false });

      const dialog = screen.queryByRole("dialog");
      // Dialog should not be visible or should not exist
      expect(dialog).not.toBeInTheDocument();
    });

    it("should render when open is true", () => {
      renderModal();

      expect(screen.getByText("Verify Transaction")).toBeInTheDocument();
    });

    it("should display transaction amount", () => {
      renderModal({ transactionAmount: "5000" });

      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });

    it("should have PIN input field", () => {
      renderModal();

      const input = screen.getByPlaceholderText("••••");
      expect(input).toBeInTheDocument();
    });

    it("should have Show/Hide PIN button", () => {
      renderModal();

      expect(screen.getByText(/Show|Hide/)).toBeInTheDocument();
    });
  });

  describe("PIN Input", () => {
    it("should accept numeric input only", async () => {
      renderModal();

      const input = screen.getByPlaceholderText("••••") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "abcd" } });

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should limit input to 4 digits", async () => {
      renderModal();

      const input = screen.getByPlaceholderText("••••") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "12345" } });

      await waitFor(() => {
        expect(input.value).toBe("1234");
      });
    });

    it("should show digit count", async () => {
      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "12" } });

      await waitFor(() => {
        expect(screen.getByText("2/4 digits entered")).toBeInTheDocument();
      });
    });

    it("should handle backspace key", async () => {
      renderModal();

      const input = screen.getByPlaceholderText("••••") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "123" } });
      fireEvent.keyDown(input, { key: "Backspace" });

      await waitFor(() => {
        expect(input.value).toBe("12");
      });
    });
  });

  describe("PIN Visibility Toggle", () => {
    it("should toggle PIN visibility", async () => {
      renderModal();

      const input = screen.getByPlaceholderText("••••") as HTMLInputElement;
      const toggleButton = screen.getByText("Show");

      expect(input.type).toBe("password");

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(input.type).toBe("text");
      });
    });
  });

  describe("Form Submission", () => {
    it("should auto-submit when 4 digits entered", async () => {
      mockVerificationService.submitTopup.mockResolvedValueOnce({
        success: true,
      });

      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        expect(mockVerificationService.submitTopup).toHaveBeenCalled();
      });
    });

    it("should call onSuccess when PIN is correct", async () => {
      mockVerificationService.submitTopup.mockResolvedValueOnce({
        success: true,
      });

      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should show error on invalid PIN", async () => {
      mockVerificationService.submitTopup.mockResolvedValueOnce({
        success: false,
        message: "Invalid PIN",
      });

      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "0000" } });

      await waitFor(() => {
        expect(screen.getByText("Invalid PIN")).toBeInTheDocument();
      });
    });

    it("should clear PIN after failed attempt", async () => {
      mockVerificationService.submitTopup.mockResolvedValueOnce({
        success: false,
        message: "Invalid PIN",
      });

      renderModal();

      const input = screen.getByPlaceholderText("••••") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "0000" } });

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should disable verify button when PIN not complete", () => {
      renderModal();

      const verifyButton = screen.getByText("Verify");
      expect(verifyButton).toBeDisabled();
    });

    it("should enable verify button when PIN complete", async () => {
      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        const verifyButton = screen.getByText("Verify");
        expect(verifyButton).not.toBeDisabled();
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should show error when blocked", async () => {
      // Mock the useSecurityStore to return isBlocked: true
      jest.mock("@/store/securityStore", () => ({
        useSecurityStore: () => ({
          isBlocked: true,
          recordPinAttempt: jest.fn(),
        }),
      }));

      renderModal();

      const input = screen.getByPlaceholderText("••••");
      expect(input).toBeDisabled();
    });
  });

  describe("Modal Actions", () => {
    it("should close modal when close button clicked", () => {
      renderModal();

      const closeButton = screen.getByText("Cancel");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose callback", () => {
      renderModal();

      const closeButton = screen.getByText("Cancel");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator during verification", async () => {
      mockVerificationService.submitTopup.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 1000)
          )
      );

      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        expect(screen.getByText("Verifying...")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockVerificationService.submitTopup.mockRejectedValueOnce(
        new Error("Network error")
      );

      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        expect(screen.getByText(/Network error|failed/i)).toBeInTheDocument();
      });
    });

    it("should display error message from server", async () => {
      mockVerificationService.submitTopup.mockResolvedValueOnce({
        success: false,
        message: "Transaction amount exceeds limit",
      });

      renderModal();

      const input = screen.getByPlaceholderText("••••");
      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        expect(
          screen.getByText("Transaction amount exceeds limit")
        ).toBeInTheDocument();
      });
    });
  });
});
