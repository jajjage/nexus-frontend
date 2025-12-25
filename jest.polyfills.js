// Polyfills for MSW and JSDOM compatibility
const { TextEncoder, TextDecoder } = require("util");
const {
  ReadableStream,
  WritableStream,
  TransformStream,
} = require("stream/web");
const { MessageChannel, MessagePort } = require("worker_threads");

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  WritableStream,
  TransformStream,
  MessageChannel,
  MessagePort,
  BroadcastChannel: class BroadcastChannel {
    constructor(name) {}
    postMessage(message) {}
    close() {}
  },
});

const { fetch, Headers, Request, Response } = require("undici");

Object.assign(global, {
  fetch,
  Headers,
  Request,
  Response,
});
