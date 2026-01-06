import {
  useAdminProvider,
  useAdminProviders,
  useCreateProvider,
  useDeleteProvider,
  useUpdateProvider,
} from "@/hooks/admin/useAdminProviders";
import { adminProviderService } from "@/services/admin/provider.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/provider.service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdminProviderService = adminProviderService as Mocked<
  typeof adminProviderService
>;

describe("Admin Provider Hooks", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAdminProviders", () => {
    const mockProvidersResponse = {
      success: true,
      message: "Providers fetched",
      data: {
        providers: [
          {
            id: "prov-1",
            name: "palmpay",
            apiBase: "https://api.palmpay.com",
            isActive: true,
            createdAt: "2026-01-01T00:00:00Z",
          },
          {
            id: "prov-2",
            name: "monnify",
            apiBase: "https://api.monnify.com",
            isActive: false,
            createdAt: "2026-01-02T00:00:00Z",
          },
        ],
      },
    };

    it("should fetch providers list successfully", async () => {
      mockAdminProviderService.getProviders.mockResolvedValue(
        mockProvidersResponse
      );

      const { result } = renderHook(() => useAdminProviders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProvidersResponse);
      expect(mockAdminProviderService.getProviders).toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockAdminProviderService.getProviders.mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useAdminProviders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAdminProvider", () => {
    const mockProviderResponse = {
      success: true,
      message: "Provider fetched",
      data: {
        id: "prov-123",
        name: "palmpay",
        apiBase: "https://api.palmpay.com",
        isActive: true,
        config: { key: "value" },
        createdAt: "2026-01-01T00:00:00Z",
      },
    };

    it("should fetch single provider by ID", async () => {
      mockAdminProviderService.getProviderById.mockResolvedValue(
        mockProviderResponse
      );

      const { result } = renderHook(() => useAdminProvider("prov-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProviderResponse);
      expect(mockAdminProviderService.getProviderById).toHaveBeenCalledWith(
        "prov-123"
      );
    });

    it("should not fetch when providerId is empty", async () => {
      const { result } = renderHook(() => useAdminProvider(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockAdminProviderService.getProviderById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateProvider", () => {
    it("should create provider successfully", async () => {
      const createData = {
        name: "newprovider",
        apiBase: "https://api.new.com",
        webhookSecret: "secret123",
        isActive: true,
        config: { test: true },
      };

      mockAdminProviderService.createProvider.mockResolvedValue({
        success: true,
        message: "Provider created successfully",
        data: {
          provider: {
            id: "prov-new",
            name: createData.name,
            apiBase: createData.apiBase,
            isActive: createData.isActive,
            config: createData.config,
            createdAt: "2026-01-05T00:00:00Z",
          },
        },
      });

      const { result } = renderHook(() => useCreateProvider(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(createData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminProviderService.createProvider).toHaveBeenCalledWith(
        createData
      );
    });

    it("should handle create error", async () => {
      mockAdminProviderService.createProvider.mockRejectedValue({
        response: {
          data: {
            message: "Provider name already exists",
          },
        },
      });

      const { result } = renderHook(() => useCreateProvider(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          name: "existing",
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useUpdateProvider", () => {
    it("should update provider successfully", async () => {
      const updateData = {
        providerId: "prov-123",
        data: {
          name: "updatedprovider",
          isActive: false,
        },
      };

      mockAdminProviderService.updateProvider.mockResolvedValue({
        success: true,
        message: "Provider updated successfully",
        data: {
          provider: {
            id: "prov-123",
            name: "updatedprovider",
            apiBase: "https://api.test.com",
            isActive: false,
            createdAt: "2026-01-01T00:00:00Z",
          },
        },
      });

      const { result } = renderHook(() => useUpdateProvider(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminProviderService.updateProvider).toHaveBeenCalledWith(
        "prov-123",
        updateData.data
      );
    });
  });

  describe("useDeleteProvider", () => {
    it("should delete provider successfully", async () => {
      mockAdminProviderService.deleteProvider.mockResolvedValue({
        success: true,
        message: "Provider deleted successfully",
        data: {
          message: "Provider deleted successfully",
        },
      });

      const { result } = renderHook(() => useDeleteProvider(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate("prov-123");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminProviderService.deleteProvider).toHaveBeenCalledWith(
        "prov-123"
      );
    });

    it("should handle delete error", async () => {
      mockAdminProviderService.deleteProvider.mockRejectedValue({
        response: {
          data: {
            message: "Provider is in use and cannot be deleted",
          },
        },
      });

      const { result } = renderHook(() => useDeleteProvider(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate("prov-123");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
