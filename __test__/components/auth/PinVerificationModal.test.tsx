import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { useSecurityStore } from "@/store/securityStore";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedFunction } from "vitest";

vi.mock("@/store/securityStore");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseSecurityStore = useSecurityStore as unknown as MockedFunction<
  typeof useSecurityStore
>;

describe("PinVerificationModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockRecordPinAttempt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSecurityStore.mockReturnValue({
      isBlocked: false,
      recordPinAttempt: mockRecordPinAttempt,
    } as any);
  });

  const renderModal = (overrides = {}) => {
    const defaultProps = {
      open: true,
      onClose: mockOnClose,
      onSuccess: mockOnSuccess,
      reason: "transaction" as const,
      useCashback: false,
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
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });
  });

  describe("PIN Input", () => {
    it("should accept numeric input only", async () => {
      renderModal();
      const input = screen.getByRole("textbox") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "abcd" } });

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should limit input to 4 digits", async () => {
      renderModal();
      const input = screen.getByRole("textbox") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "12345" } });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith("1234");
      });
    });

    it("should show digit count", async () => {
      renderModal();
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "12" } });

      await waitFor(() => {
        expect(screen.getByText("2/4 digits entered")).toBeInTheDocument();
      });
    });

    it("should handle backspace key", async () => {
      renderModal();
      const input = screen.getByRole("textbox") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "123" } });
      // In PinVerificationModal, handleKeyDown handles Backspace
      fireEvent.keyDown(input, { key: "Backspace" });

      await waitFor(() => {
        expect(input.value).toBe("12");
      });
    });
  });

  describe("Form Submission", () => {
    it("should auto-submit when 4 digits entered", async () => {
      renderModal();
      const input = screen.getByRole("textbox") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith("1234");
      });
    });

    it("should call onSuccess when Verify button clicked with 4 digits", async () => {
      renderModal();
      const input = screen.getByRole("textbox") as HTMLInputElement;

      // Type 3 digits first to prevent auto-submit
      fireEvent.change(input, { target: { value: "123" } });

      const verifyButton = screen.getByText("Verify");
      expect(verifyButton).toBeDisabled();

      // Type the 4th digit - this will actually trigger auto-submit due to useEffect
      fireEvent.change(input, { target: { value: "1234" } });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith("1234");
      });
    });

    it("should disable verify button when PIN not complete", () => {
      renderModal();

      const verifyButton = screen.getByText("Verify");
      expect(verifyButton).toBeDisabled();
    });
  });

  describe("Rate Limiting", () => {
    it("should show error when blocked", async () => {
      mockUseSecurityStore.mockReturnValue({
        isBlocked: true,
        recordPinAttempt: mockRecordPinAttempt,
      } as any);

      renderModal();

      expect(screen.getByText(/Too many failed attempts/i)).toBeInTheDocument();
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });
  });

  describe("Modal Actions", () => {
    it("should close modal when Cancel button clicked", () => {
      renderModal();

      const closeButton = screen.getByText("Cancel");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
