import { renderHook, waitFor } from "@testing-library/react";
import { useProfile, useUpdateProfile, userKeys } from "@/hooks/useUser";
import { userService } from "@/services/user.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock the service
jest.mock("@/services/user.service");
const mockUserService = userService as jest.Mocked<typeof userService>;

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useUser Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useProfile", () => {
    it("should fetch user profile successfully", async () => {
      const mockProfile = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };
      mockUserService.getProfile.mockResolvedValue(mockProfile as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for success
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfile);
      expect(mockUserService.getProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe("useUpdateProfile", () => {
    it("should update profile and invalidate cache", async () => {
      const queryClient = new QueryClient();
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      // Pre-seed cache
      queryClient.setQueryData(userKeys.profile(), { name: "Old Name" });
      const spyInvalidate = jest.spyOn(queryClient, "invalidateQueries");

      const mockUpdatedProfile = { name: "New Name" };
      mockUserService.updateProfile.mockResolvedValue(
        mockUpdatedProfile as any
      );

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      result.current.mutate({ name: "New Name" } as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check if cache was updated and invalidated
      expect(queryClient.getQueryData(userKeys.profile())).toEqual(
        mockUpdatedProfile
      );
      expect(spyInvalidate).toHaveBeenCalledWith({
        queryKey: userKeys.profile(),
      });
    });
  });
});
