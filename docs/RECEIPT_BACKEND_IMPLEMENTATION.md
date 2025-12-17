# Backend Receipt Generation — Implementation Plan

Status: Draft

Purpose

- Provide a complete backend plan to generate, store, and serve transaction receipts (PDF and PNG) from an Express + Knex + PostgreSQL backend.
- Include DB schema (Knex migration), service responsibilities, controller/route definitions, storage strategy (files), background processing recommendations, testing plan, security and monitoring considerations.

Goals

- Generate receipts that visually match the frontend `TransactionReceipt` (logo, colors, cashbacks, full TXN ID).
- Produce compact, high-quality PDFs (prefer vector/text where possible) and PNG/JPEG images for sharing.
- Ensure reliable generation (no client-side CORS issues) and a robust API for consumers.

High-level Architecture Options

1. Client-side (current): html2canvas/jsPDF in browser
   - Pros: No backend changes, quick to iterate.
   - Cons: CORS for images, large image-based PDFs, inconsistent rendering across browsers.
2. Server-side (recommended for production): backend renders HTML template -> PDF/image
   - Approaches: Puppeteer (headless Chromium), wkhtmltopdf, or server-side HTML->PDF library.
   - Pros: Consistent rendering, can embed fonts, proxy/inline images, produce smaller vector/text PDFs.
   - Cons: Requires backend work + resource (CPU/memory) + possible queueing.

Recommendation

- Implement a server-side receipt generation service using Puppeteer to render a stable HTML template (same CSS as frontend where feasible), produce PDF and PNG, store them in S3 (or object store), and return signed URLs.
- Use a background job queue (BullMQ with Redis) for generation to avoid blocking requests and to handle retries.

Requirements (data & assets)

- Transaction data: transaction id, amount, direction, createdAt, reference, method, balanceAfter, related.\* (recipient_phone, operatorCode/operator.name, cashbackUsed, cashbackEarned, amountPaid, status, type), metadata.
- User context: userId (for permission and storage namespace).
- Assets: company logo, fonts and CSS used by the receipt template. Copy these assets into backend static assets or embed them in template.

Database (Postgres) — new table: `receipts`
Purpose: store metadata about generated receipt files and link to transactions.
Recommended columns:

- id (uuid) — primary key
- transaction_id (uuid) — foreign key -> transactions.id (index)
- user_id (uuid) — owner (index)
- type (enum) — `pdf` | `png` (or keep as format per file record)
- template_version (string) — e.g. `v1` (for future template changes)
- storage_path (text) — S3 key or local file path
- filename (text)
- mime_type (text)
- size_bytes (bigint)
- status (varchar) — `pending` | `generated` | `failed`
- error_message (text) — optional
- generated_at (timestamp with time zone) — when generation completed
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

Knex migration example

```js
// migrations/2025xxxx_create_receipts_table.js
exports.up = function (knex) {
  return knex.schema.createTable("receipts", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("transaction_id")
      .notNullable()
      .references("id")
      .inTable("transactions")
      .onDelete("CASCADE");
    t.uuid("user_id").notNullable().references("id").inTable("users");
    t.string("format", 10).notNullable(); // 'pdf' | 'png'
    t.string("template_version").notNullable().defaultTo("v1");
    t.text("storage_path");
    t.string("filename");
    t.string("mime_type");
    t.bigInteger("size_bytes");
    t.string("status").notNullable().defaultTo("pending");
    t.text("error_message");
    t.timestamp("generated_at");
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.index(["transaction_id"]);
    t.index(["user_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("receipts");
};
```

Storage

- Recommended: AWS S3 (or compatible object storage). Pros: scalable, signed URLs, lifecycle rules.
- Key format: `receipts/{userId}/{transactionId}/{template_version}/{receiptId}.{ext}`
- If S3 is not available, store in local disk under `/data/receipts/...` and serve via a signed endpoint with proper headers.
- Set lifecycle rules to expire old receipts if you need to save storage costs.

Generation flow (server-side)

1. Request: client calls `POST /api/receipts/generate` with payload { transactionId, format: 'pdf'|'png' }
2. Auth middleware verifies user owns transaction.
3. Controller enqueues job to generation queue (store receipts row with status `pending`, return receiptId).
4. Worker picks up job, fetches transaction data, renders an HTML template (using the same markup as frontend or a template tuned for PDF), and uses Puppeteer to render a PDF or PNG.
5. Worker saves resulting file to S3, updates `receipts` row with `storage_path`, `filename`, `mime_type`, `size_bytes`, `status=generated`, `generated_at`.
6. Client polls `GET /api/receipts/:id` to get status and download URL or receives a webhook/WS notification when ready.

Routes (Express)

- POST /api/receipts/generate
  - Auth required
  - Body: { transactionId: string, format?: 'pdf'|'png' } (default pdf)
  - Response: { receiptId, status: 'pending' }
- GET /api/receipts/:receiptId
  - Auth required (owner or admin)
  - Response: { id, transactionId, status, generatedAt, downloadUrl (signed) }
- GET /api/receipts/transaction/:transactionId
  - List receipts for a transaction
- (Optional) GET /api/receipts/:receiptId/download?disposition=inline|attachment
  - Direct streaming proxy to S3 with correct Content-Type and Content-Disposition

Controller pseudocode (Express + Knex)

```js
// controllers/receiptsController.js
const createReceipt = async (req, res) => {
  const { transactionId, format = "pdf" } = req.body;
  const userId = req.user.id;

  // TODO: validate transaction belongs to user
  const [tx] = await knex("transactions").where({
    id: transactionId,
    user_id: userId,
  });
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  const [receipt] = await knex("receipts")
    .insert({
      transaction_id: transactionId,
      user_id: userId,
      format,
      status: "pending",
    })
    .returning("*");

  // enqueue job
  await queue.add("generateReceipt", {
    receiptId: receipt.id,
    transactionId,
    format,
  });

  return res.json({ receiptId: receipt.id, status: "pending" });
};
```

Worker / Service responsibilities

- `ReceiptService.generate(receiptId)`:
  - Load receipt record and transaction data
  - Render HTML using template + transaction data
  - Launch Puppeteer to render PDF/PNG
    - For PDF: use `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`
    - For PNG: use `page.screenshot({ type: 'jpeg'|'png', quality: 80, fullPage: false })` then optionally use `sharp` to compress/resize
  - Upload to S3: use the key pattern above
  - Update DB record with storage path, size, mime, status
  - On error: update record with status `failed` and `error_message`

- Considerations:
  - Reuse a persistent Puppeteer browser instance in the worker process to reduce start-up cost.
  - Use headless chrome options appropriate for the runtime (e.g., `--no-sandbox` in containers).
  - Preload fonts and logos so template rendering includes them (embed base64 or use local static assets).

Template & assets

- Use a server-side HTML template (Handlebars or React SSR). Template should:
  - Mirror `TransactionReceipt` layout and colors (use site CSS variables or inline CSS for template stability).
  - Include company logo (load from backend static assets or embed as data URI to avoid CORS).
  - Ensure fonts are embedded or loaded locally to avoid fallback differences.
- Keep a `template_version` column so you can change template without invalidating old receipts.

PDF size optimizations

- Use text-based PDFs when possible (render text as real text, not images) — Puppeteer with HTML/CSS will generate text-based PDF output if content is textual.
- Avoid capturing the entire page as an image for the PDF (image-based PDFs are larger). Use `page.pdf()` to get vector/text PDF rather than `page.screenshot()`.
- If you must embed images, compress them (JPEG at 70-85) and resize to required pixel dimensions.
- Strip unused resources and minify template CSS.

Image generation (PNG/JPEG) notes

- For PNG: choose appropriate DPI and compress with `pngquant` or `sharp`.
- For sharing use JPEG for smaller output with high quality (e.g., 80) or WEBP if supported by clients.

Queue & reliability

- Use BullMQ (Redis) or equivalent to enqueue generation jobs.
- Add retry policy with exponential backoff.
- Record attempts in DB for observability.

Security & Access

- Only authenticated users should generate or access receipts for their transactions.
- Use signed S3 URLs (expiring) for public download links.
- Sanitize transaction data before rendering.
- Rate-limit generation endpoint to prevent abuse.

Testing Strategy

1. Unit tests (Jest)

- `ReceiptService.renderHtml()` — given transaction data returns non-empty HTML and includes the TXN ID and logo path.
- `ReceiptService.generatePdf()` — mock Puppeteer to ensure `page.pdf` is called with expected options.
- Knex migration tests: ensure schema can be migrated and rolled back.

2. Integration tests (supertest + test DB)

- POST `/api/receipts/generate` enqueues a job and creates DB row.
- Mock worker to transition status `generated` and verify endpoints return signedUrl.

3. E2E tests (optional)

- Real generation in a CI environment with Puppeteer and S3 emulator (localstack) — assert generated PDF contains TXN ID and logo.
- Validate file size (e.g., < 300 KB for PDF if text-based) and that image contains expected elements.

Example unit test outline (Jest)

```js
test("renderHtml includes txn id and company logo", async () => {
  const html = await ReceiptService.renderHtml(sampleTx, {
    logoPath: "/assets/logo.svg",
  });
  expect(html).toContain(sampleTx.id);
  expect(html).toContain("/assets/logo.svg");
});
```

Operational & Monitoring

- Log generation attempts and durations; capture Puppeteer errors.
- Add metrics: receipts_generated_total, receipts_generation_time_seconds, receipts_failed_total.
- Configure alerts for repeated failures or timeouts.

Deployment & Scaling

- Puppeteer can be memory/CPU intensive. Run workers on separate instances or as a horizontal pool.
- Use a job concurrency setting tuned to available memory CPU.
- Use S3 for storage to avoid disk pressure on app instances.

Rollout Plan

1. Implement service & worker in a staging environment with test DB and localstack (S3 emulator).
2. Run tests and inspect generated receipts to ensure visual parity.
3. Enable on limited user subset or internal accounts.
4. Gradually roll out and monitor logs/metrics.

Rollback plan

- If generating receipts causes resource pressure, disable generation endpoint and fall back to client-side generation temporarily.

Developer examples

- Knex migration: see above.
- Express route & controller: see above pseudocode.
- ReceiptService skeleton (Node.js)

```js
// services/receiptService.js
const puppeteer = require("puppeteer");
const s3 = require("../lib/s3");

class ReceiptService {
  static async renderHtml(transaction, opts) {
    // use handlebars or a small React SSR to render markup
    // inline critical CSS and include logo as data-uri or local path
  }

  static async generatePdfFromHtml(htmlBuffer) {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(htmlBuffer.toString(), { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    return pdfBuffer;
  }

  static async uploadToS3(key, buffer, mime) {
    return s3.upload({ Key: key, Body: buffer, ContentType: mime });
  }
}

module.exports = ReceiptService;
```

Notes about logos & fonts

- Place the company's logo and fonts in backend static assets (e.g., `/assets/receipt/logo.svg`, `/assets/receipt/fonts/`), and reference them with absolute `file://` or `http://localhost:PORT/assets/...` paths when rendering with Puppeteer to avoid remote CORS issues.
- Consider inlining the logo as base64 into the HTML template to eliminate remote fetching.

Checklist (developer)

- [ ] Add `receipts` Knex migration
- [ ] Add `ReceiptService` skeleton and tests
- [ ] Add worker (BullMQ) and configure Redis
- [ ] Add S3 integration + env config (`S3_BUCKET`, `S3_REGION`, `S3_KEY_PREFIX`)
- [ ] Add Express routes + auth middleware
- [ ] Add end-to-end test with Puppeteer in CI (or localstack)
- [ ] Add monitoring & rate limiting

Estimated effort

- Minimal PoC (generate PDFs for single node, local S3 emulator): 2–3 days
- Production-ready (queueing, retries, monitoring, storage lifecycle): 4–7 days depending on infra readiness

Appendix: quick sample curl usage (after generation)

- Request generation:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"transactionId":"<id>","format":"pdf"}' https://api.example.com/api/receipts/generate
```

- Poll status:

```bash
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/receipts/<receiptId>
```

---

If you want, I can:

- Scaffold the Express controller, Knex migration file, and a `ReceiptService` skeleton in the repo.
- Create a Puppeteer worker example (Dockerfile) and a basic HTML template that mirrors your `TransactionReceipt` markup.

Which of these should I create next: migration + controller + service scaffold, or a runnable Puppeteer worker + example template? Or both (I can scaffold migration + controller first)?
