"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { detectNetworkProvider } from "@/lib/network-utils";
import { RecentNumber } from "@/types/api.types";
import { Contact2, X } from "lucide-react";
import { useState } from "react";

interface NetworkDetectorProps {
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  onNetworkDetected: (network: string) => void;
  selectedNetworkLogo?: string;
  recentNumbers?: RecentNumber[] | string[];
}

export function NetworkDetector({
  phoneNumber,
  onPhoneNumberChange,
  onNetworkDetected,
  selectedNetworkLogo,
  recentNumbers = [],
}: NetworkDetectorProps) {
  const [open, setOpen] = useState(false);

  // Handle input change and detection
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    onPhoneNumberChange(value);

    const network = detectNetworkProvider(value);
    if (network) {
      onNetworkDetected(network);
    }
  };

  // Handle clear input
  const handleClear = () => {
    onPhoneNumberChange("");
  };

  // Select beneficiary
  const handleSelectNumber = (number: string) => {
    onPhoneNumberChange(number);
    setOpen(false);
    const network = detectNetworkProvider(number);
    if (network) {
      onNetworkDetected(network);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handleChange}
          placeholder="Enter Phone Number (e.g., 0803...)"
          className="focus:ring-primary/20 h-14 rounded-xl px-4 pr-32 text-lg shadow-sm transition-all focus:ring-2"
        />

        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-2">
          {/* Clear Button - Only show when there is input */}
          {phoneNumber && (
            <button
              onClick={handleClear}
              className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex size-8 items-center justify-center rounded-full"
            >
              <X className="size-4" />
            </button>
          )}

          {selectedNetworkLogo && (
            <div className="flex size-8 items-center justify-center overflow-hidden rounded-full border bg-white shadow-sm">
              <Avatar className="size-full">
                <AvatarImage
                  src={selectedNetworkLogo}
                  className="object-contain"
                />
                <AvatarFallback className="text-[10px]">NET</AvatarFallback>
              </Avatar>
            </div>
          )}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex size-10 items-center justify-center rounded-full transition-colors">
                <Contact2 className="size-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search recent numbers..." />
                <CommandList>
                  <CommandEmpty>No recent numbers found.</CommandEmpty>
                  <CommandGroup heading="Recent Numbers">
                    {recentNumbers.length === 0 ? (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        No recent numbers
                      </div>
                    ) : (
                      recentNumbers.map((item, index) => {
                        // Handle both string and object formats
                        const num =
                          typeof item === "string" ? item : item.phoneNumber;
                        const id = typeof item === "string" ? index : item.id;

                        return (
                          <CommandItem
                            key={`${id}-${index}`}
                            value={num}
                            onSelect={() => handleSelectNumber(num)}
                            className="flex items-center justify-between py-3"
                          >
                            <span className="font-medium">{num}</span>
                          </CommandItem>
                        );
                      })
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
