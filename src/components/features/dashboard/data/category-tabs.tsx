import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ProductCategory } from "@/types/product.types";

interface CategoryTabsProps {
  categories: ProductCategory[];
  selectedCategory: string; // category slug or "all"
  onSelect: (category: string) => void;
  isLoading?: boolean;
}

/**
 * CategoryTabs - Horizontal scrollable tabs for filtering products by category
 *
 * Now uses dynamic categories from API instead of hardcoded list.
 * Includes an "All" tab to show all products.
 */
export function CategoryTabs({
  categories,
  selectedCategory,
  onSelect,
  isLoading = false,
}: CategoryTabsProps) {
  if (isLoading) {
    return (
      <div className="flex space-x-2 px-1 pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  // Sort categories by priority (lower = higher priority)
  const sortedCategories = [...categories].sort(
    (a, b) => (a.priority ?? 99) - (b.priority ?? 99)
  );

  return (
    <ScrollArea className="w-full pb-4 whitespace-nowrap">
      <div className="flex w-max space-x-2 px-1">
        {/* All tab */}
        <button
          onClick={() => onSelect("all")}
          className={cn(
            "rounded-full px-6 py-2 text-sm font-medium transition-all",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All
        </button>

        {/* Dynamic category tabs */}
        {sortedCategories.map((category) => {
          const isActive = selectedCategory === category.slug;
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.slug)}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
