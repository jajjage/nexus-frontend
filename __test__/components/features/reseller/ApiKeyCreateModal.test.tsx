import { ApiKeyCreateModal } from "@/components/features/reseller/ApiKeyCreateModal";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockCreateKeyMutate = vi.fn();

vi.mock("@/hooks/useReseller", () => ({
  useCreateApiKey: vi.fn(() => ({
    mutate: mockCreateKeyMutate,
    isPending: false,
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ApiKeyCreateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(global.URL, "createObjectURL", {
      writable: true,
      value: vi.fn(() => "blob:test"),
    });

    Object.defineProperty(global.URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn(),
    });
  });

  it("requires save action (copy/download) before final close action is enabled", async () => {
    mockCreateKeyMutate.mockImplementation((_, options) => {
      options?.onSuccess?.({
        success: true,
        message: "ok",
        data: { key: "nx_live_secret_key" },
      });
    });

    render(<ApiKeyCreateModal open={true} onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Key Name/i), {
      target: { value: "Website integration" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Key/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your API Key/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", {
      name: /I've Saved My Key/i,
    });
    expect(closeButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /\.txt/i }));
    expect(closeButton).not.toBeDisabled();
  });
});
