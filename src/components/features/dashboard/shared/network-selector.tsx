import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NetworkSelectorProps {
  selectedNetwork: string;
  onSelect: (networkName: string) => void;
  operators: { name: string; logoUrl: string }[];
}

export function NetworkSelector({
  selectedNetwork,
  onSelect,
  operators,
}: NetworkSelectorProps) {
  return (
    <div className="no-scrollbar flex items-center justify-between gap-2 overflow-x-auto py-4 md:gap-4 lg:gap-6">
      {operators.map((op) => {
        // Extract a simple ID from the name (e.g., "MTN Nigeria" -> "MTN")
        // or just use the full name if that's what we filter by.
        // Let's try to match loosely.
        const isActive = selectedNetwork === op.name;

        return (
          <button
            key={op.name}
            onClick={() => onSelect(op.name)}
            className={cn(
              "flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all",
              isActive
                ? "bg-foreground border-foreground text-background"
                : "border-muted-foreground/20 hover:bg-muted/10 bg-transparent"
            )}
          >
            {op.logoUrl ? (
              <div className="relative size-10 overflow-hidden rounded-full">
                <Avatar className="size-full">
                  <AvatarImage
                    src={op.logoUrl}
                    alt={op.name}
                    className="object-contain"
                  />
                  <AvatarFallback className={isActive ? "text-background" : ""}>
                    {op.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <span
                className={cn(
                  "text-xs font-bold",
                  isActive ? "text-background" : ""
                )}
              >
                {op.name}
              </span>
            )}
            <span
              className={cn(
                "text-[10px] leading-none font-medium transition-all",
                isActive
                  ? "opacity-100"
                  : "text-muted-foreground opacity-70 group-hover:opacity-100"
              )}
            >
              {op.name.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
