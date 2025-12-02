import { useState, useEffect } from "react";

export interface Beneficiary {
  id: string;
  name: string;
  phoneNumber: string;
  network?: string;
  lastUsed?: string;
}

// Mock data
const MOCK_BENEFICIARIES: Beneficiary[] = [
  {
    id: "1",
    name: "My MTN Line",
    phoneNumber: "08031234567",
    network: "MTN",
    lastUsed: "2024-01-20",
  },
  {
    id: "2",
    name: "Mom",
    phoneNumber: "08051234567",
    network: "Glo",
    lastUsed: "2024-01-18",
  },
  {
    id: "3",
    name: "Office WiFi",
    phoneNumber: "09091234567",
    network: "9mobile",
    lastUsed: "2024-01-15",
  },
];

export function useBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setBeneficiaries(MOCK_BENEFICIARIES);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { beneficiaries, isLoading };
}
