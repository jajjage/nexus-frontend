import { render, screen, fireEvent } from "@testing-library/react";
import { ReferralLinkSection } from "@/components/features/referrals/referral-link-section";
import {
  useReferralLink,
  useRegenerateReferralCode,
  useDeactivateReferralLink,
} from "@/hooks/useReferrals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { toast } from "sonner";

// Mock dependencies
vi.mock("@/hooks/useReferrals", () => ({
  useReferralLink: vi.fn(),
  useRegenerateReferralCode: vi.fn(),
  useDeactivateReferralLink: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

// Mock clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ReferralLinkSection", () => {
  const mockLinkData = {
    referralLink: "https://nexus.data/register?ref=USER123",
    referralCode: "USER123",
    sharingMessage: "Join me on Nexus Data!",
    qrCodeUrl: "https://example.com/qr.png",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRegenerateReferralCode as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
    });
    (useDeactivateReferralLink as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
    });
  });

  it("should display the referral link and code", () => {
    (useReferralLink as vi.Mock).mockReturnValue({
      data: { data: mockLinkData },
      isLoading: false,
    });

    render(<ReferralLinkSection />, { wrapper: createWrapper() });

    expect(
      screen.getByDisplayValue(mockLinkData.referralLink)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Code: ${mockLinkData.referralCode}`)
    ).toBeInTheDocument();
  });

  it("should copy link to clipboard when copy button is clicked", async () => {
    (useReferralLink as vi.Mock).mockReturnValue({
      data: { data: mockLinkData },
      isLoading: false,
    });

    render(<ReferralLinkSection />, { wrapper: createWrapper() });

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      mockLinkData.referralLink
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("copied")
    );
  });
});
