import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const CATEGORIES = [
  "HOT",
  "Daily",
  "Weekly",
  "Monthly",
  "XtraValue",
  "Roaming",
  "Other",
];

export function CategoryTabs({
  selectedCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <ScrollArea className="w-full pb-4 whitespace-nowrap">
      <div className="flex w-max space-x-2 px-1">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {category}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
