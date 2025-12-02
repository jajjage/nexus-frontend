export type NetworkProvider = "MTN" | "Glo" | "Airtel" | "9mobile" | null;

const PREFIXES: Record<string, string[]> = {
  MTN: [
    "0803",
    "0806",
    "0703",
    "0903",
    "0810",
    "0813",
    "0814",
    "0816",
    "0906",
    "0706",
  ],
  Glo: ["0805", "0807", "0705", "0815", "0811", "0905"],
  Airtel: [
    "0802",
    "0808",
    "0708",
    "0812",
    "0701",
    "0902",
    "0901",
    "0904",
    "0907",
    "0912",
  ],
  "9mobile": ["0809", "0818", "0817", "0909", "0908"],
};

export function detectNetworkProvider(phoneNumber: string): NetworkProvider {
  // Remove non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.length < 4) return null;

  // Check for standard 0803... format (11 digits)
  const prefix = cleaned.substring(0, 4);

  // Check against prefix lists
  for (const [provider, prefixes] of Object.entries(PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return provider as NetworkProvider;
    }
  }

  // Handle +234 format if necessary (simplified for now)
  if (cleaned.startsWith("234") && cleaned.length >= 13) {
    const internationalPrefix = "0" + cleaned.substring(3, 6);
    for (const [provider, prefixes] of Object.entries(PREFIXES)) {
      if (prefixes.includes(internationalPrefix)) {
        return provider as NetworkProvider;
      }
    }
  }

  return null;
}
