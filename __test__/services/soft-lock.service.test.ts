import { SoftLockService } from "@/services/soft-lock.service";

describe("softLockService", () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    mockCallback = jest.fn();
    SoftLockService.cleanup(); // Clean up any previous listeners
  });

  afterEach(() => {
    SoftLockService.cleanup();
  });

  describe("Activity Tracking", () => {
    it("should initialize listeners", () => {
      SoftLockService.initialize(mockCallback);

      // Service should be initialized without throwing
      expect(mockCallback).not.toHaveBeenCalled(); // Not called yet
    });

    it("should track mousedown activity", (done) => {
      SoftLockService.initialize(mockCallback);

      const event = new MouseEvent("mousedown", { bubbles: true });
      document.dispatchEvent(event);

      // Wait for debounce
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 600);
    });

    it("should track keydown activity", (done) => {
      SoftLockService.initialize(mockCallback);

      const event = new KeyboardEvent("keydown", { bubbles: true });
      document.dispatchEvent(event);

      // Wait for debounce
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 600);
    });

    it("should track touchstart activity", (done) => {
      SoftLockService.initialize(mockCallback);

      const event = new TouchEvent("touchstart", { bubbles: true });
      document.dispatchEvent(event);

      // Wait for debounce
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 600);
    });

    it("should debounce activity calls", (done) => {
      SoftLockService.initialize(mockCallback);

      // Fire multiple events quickly
      const event1 = new MouseEvent("mousedown", { bubbles: true });
      const event2 = new MouseEvent("click", { bubbles: true });
      const event3 = new MouseEvent("mousedown", { bubbles: true });

      document.dispatchEvent(event1);
      document.dispatchEvent(event2);
      document.dispatchEvent(event3);

      // Wait for debounce
      setTimeout(() => {
        // Should only be called once due to debounce
        expect(mockCallback.mock.calls.length).toBe(1);
        done();
      }, 600);
    });

    it("should respect debounce delay", (done) => {
      SoftLockService.initialize(mockCallback);

      const event = new MouseEvent("mousedown", { bubbles: true });
      document.dispatchEvent(event);

      // Callback should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled();

      // Wait for debounce (500ms)
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 600);
    });
  });

  describe("Cleanup", () => {
    it("should remove all event listeners on cleanup", (done) => {
      SoftLockService.initialize(mockCallback);

      // Fire event after initialization
      const event1 = new MouseEvent("mousedown", { bubbles: true });
      document.dispatchEvent(event1);

      setTimeout(() => {
        const callCount = mockCallback.mock.calls.length;

        // Cleanup
        SoftLockService.cleanup();

        // Fire another event
        const event2 = new MouseEvent("mousedown", { bubbles: true });
        document.dispatchEvent(event2);

        setTimeout(() => {
          // Callback count should not increase
          expect(mockCallback.mock.calls.length).toBe(callCount);
          done();
        }, 600);
      }, 600);
    });

    it("should allow re-initialization after cleanup", () => {
      SoftLockService.initialize(mockCallback);
      SoftLockService.cleanup();

      // Should not throw
      expect(() => {
        SoftLockService.initialize(mockCallback);
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle scroll activity", (done) => {
      SoftLockService.initialize(mockCallback);

      const event = new Event("scroll", { bubbles: true });
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 600);
    });

    it("should handle click activity", (done) => {
      SoftLockService.initialize(mockCallback);

      const event = new MouseEvent("click", { bubbles: true });
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 600);
    });
  });
});
