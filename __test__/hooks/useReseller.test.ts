/**
 * Reseller Hooks Tests
 */

import { parseCsvToBulkItems, validateBatchSize } from "@/hooks/useReseller";
import { describe, expect, it } from "vitest";

describe("useReseller utilities", () => {
  describe("parseCsvToBulkItems", () => {
    it("should parse valid CSV with header", () => {
      const csv = `recipientPhone,amount,productCode
08012345678,500,MTN-AIRTIME
08087654321,1000,GLO-DATA-1GB`;

      const result = parseCsvToBulkItems(csv);

      expect(result.items).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.items[0]).toEqual({
        recipientPhone: "08012345678",
        amount: 500,
        productCode: "MTN-AIRTIME",
      });
    });

    it("should parse valid CSV without header", () => {
      const csv = `08012345678,500,MTN-AIRTIME`;

      const result = parseCsvToBulkItems(csv);

      expect(result.items).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it("should report errors for invalid phone numbers", () => {
      const csv = `12345,500,MTN-AIRTIME`;

      const result = parseCsvToBulkItems(csv);

      expect(result.items).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Invalid phone");
    });

    it("should report errors for invalid amounts", () => {
      const csv = `08012345678,invalid,MTN-AIRTIME`;

      const result = parseCsvToBulkItems(csv);

      expect(result.items).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Invalid amount");
    });

    it("should report errors for missing columns", () => {
      const csv = `08012345678,500`;

      const result = parseCsvToBulkItems(csv);

      expect(result.items).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Missing columns");
    });

    it("should skip empty lines", () => {
      const csv = `08012345678,500,MTN-AIRTIME

08087654321,1000,GLO-AIRTIME`;

      const result = parseCsvToBulkItems(csv);

      expect(result.items).toHaveLength(2);
    });
  });

  describe("validateBatchSize", () => {
    it("should return null for valid batch size", () => {
      const items = Array(50).fill({
        recipientPhone: "08012345678",
        amount: 100,
        productCode: "MTN-AIRTIME",
      });

      const error = validateBatchSize(items);

      expect(error).toBeNull();
    });

    it("should return error for empty batch", () => {
      const error = validateBatchSize([]);

      expect(error).toBe("No items to process");
    });

    it("should return error for batch exceeding 50 items", () => {
      const items = Array(51).fill({
        recipientPhone: "08012345678",
        amount: 100,
        productCode: "MTN-AIRTIME",
      });

      const error = validateBatchSize(items);

      expect(error).toContain("51/50");
    });
  });
});
