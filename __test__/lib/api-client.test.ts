import { toast } from "sonner";
import axios from "axios";
import apiClient, {
  resetAuthClient,
  setSessionExpiredCallback,
} from "@/lib/api-client";
import { server } from "@/mocks/server"; // Import MSW server

// 1. Mock axios fully inside the factory
// We need to return a function that is also an object (to simulate the axios instance)
jest.mock("axios", () => {
  const requestSpy = jest.fn();
  const responseSpy = jest.fn();

  const mockInstance: any = jest.fn(() => Promise.resolve({ data: {} }));

  // Attach instance methods
  mockInstance.interceptors = {
    request: { use: requestSpy },
    response: { use: responseSpy },
  };
  mockInstance.post = jest.fn(() => Promise.resolve({ data: {} }));
  mockInstance.get = jest.fn(() => Promise.resolve({ data: {} }));
  mockInstance.put = jest.fn(() => Promise.resolve({ data: {} }));
  mockInstance.defaults = { headers: { common: {} } };

  // Mock create to return our mockInstance
  mockInstance.create = jest.fn(() => mockInstance);

  return mockInstance;
});

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe("API Client Logic", () => {
  let reqSuccessHandler: any;
  let resErrorHandler: any;

  // Type assertion for the mocked axios module
  // Since we mocked 'axios' to return the instance directly as the default export
  const mockAxios = axios as unknown as jest.Mock & {
    interceptors: {
      request: { use: jest.Mock };
      response: { use: jest.Mock };
    };
    post: jest.Mock;
    create: jest.Mock;
  };

  // MSW Setup for tests that need it
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeAll(() => {
    // Extract handlers from the spies
    const requestUseSpy = mockAxios.interceptors.request.use;
    const responseUseSpy = mockAxios.interceptors.response.use;

    if (requestUseSpy.mock.calls.length > 0) {
      reqSuccessHandler = requestUseSpy.mock.calls[0][0];
    }
    if (responseUseSpy.mock.calls.length > 0) {
      // response.use(successHandler, errorHandler)
      resErrorHandler = responseUseSpy.mock.calls[0][1];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (toast.error as jest.Mock).mockClear();
    resetAuthClient();
  });

  describe("Request Interceptor", () => {
    it("should add Cache-Control headers", () => {
      const config = { headers: {} };
      const result = reqSuccessHandler(config);
      expect(result.headers["Cache-Control"]).toBe(
        "no-cache, no-store, must-revalidate"
      );
    });
  });

  describe("Response Interceptor - Error Handling", () => {
    it("should pass through non-401 errors", async () => {
      const error = {
        response: { status: 500 },
        config: { url: "/test" },
      };

      await expect(resErrorHandler(error)).rejects.toEqual(error);
    });

    it("should handle network errors (no response)", async () => {
      const error = {
        message: "Network Error",
        config: { url: "/test" },
      };
      await expect(resErrorHandler(error)).rejects.toEqual(error);
    });

    it("should attempt token refresh on 401", async () => {
      // Setup the refresh call to succeed
      mockAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

      const originalRequest = {
        url: "/protected-resource",
        headers: {},
        _retry: false,
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      const promise = resErrorHandler(error);

      // Check if refresh was called
      expect(mockAxios.post).toHaveBeenCalledWith("/auth/refresh", {});

      // Check if retry was called
      await promise;
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/protected-resource",
          _retry: true,
        })
      );
    });

    it("should queue multiple requests during refresh", async () => {
      let resolveRefresh: any;
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });
      mockAxios.post.mockReturnValue(refreshPromise);

      const req1 = { url: "/req1", _retry: false };
      const req2 = { url: "/req2", _retry: false };

      const p1 = resErrorHandler({ response: { status: 401 }, config: req1 });
      const p2 = resErrorHandler({ response: { status: 401 }, config: req2 });

      expect(mockAxios.post).toHaveBeenCalledTimes(1);

      resolveRefresh({ status: 200, data: {} });
      await Promise.all([p1, p2]);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({ url: "/req1" })
      );
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({ url: "/req2" })
      );
    });

    it("should logout user if refresh fails", async () => {
      const sessionExpiredMock = jest.fn();
      setSessionExpiredCallback(sessionExpiredMock);

      mockAxios.post.mockRejectedValue({
        response: { status: 401 },
      });

      const error = {
        response: { status: 401 },
        config: { url: "/protected" },
      };

      try {
        await resErrorHandler(error);
      } catch (e) {
        expect(e).toBeDefined();
      }

      expect(sessionExpiredMock).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("session has expired")
      );
    });

    it("should NOT logout user on 403 if it is a verification requirement", async () => {
      const sessionExpiredMock = jest.fn();
      setSessionExpiredCallback(sessionExpiredMock);

      const error = {
        response: {
          status: 403,
          data: { message: "Please verify your account before getting stats" },
        },
        config: { url: "/dashboard/referrals", headers: {} },
      };

      try {
        await resErrorHandler(error);
      } catch (e) {
        // Expected to reach here
      }

      expect(sessionExpiredMock).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalledWith(
        expect.stringContaining("session has expired")
      );
    });
  });
});
