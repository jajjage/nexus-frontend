import "@testing-library/jest-dom";
import { vi, beforeAll, afterEach, afterAll } from "vitest";
import { TextEncoder, TextDecoder } from "util";
import { fetch, Headers, Request, Response } from "undici";

// Polyfills for MSW and JSDOM
Object.assign(global, {
  TextEncoder,
  TextDecoder,
  fetch,
  Headers,
  Request,
  Response,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill for TransformStream and other web streams if needed
if (!global.TransformStream) {
  const {
    TransformStream,
    ReadableStream,
    WritableStream,
  } = require("stream/web");
  Object.assign(global, { TransformStream, ReadableStream, WritableStream });
}
