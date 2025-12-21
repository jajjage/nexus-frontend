"use client";

import { useAuth } from "@/hooks/useAuth";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";

/**
 * MarkupSyncer
 *
 * This component ensures markup data is fetched and cached once the user logs in.
 * It runs at a high level (in the app layout or dashboard wrapper) and populates
 * React Query's cache with markup data that other components can then use.
 *
 * Other components can then use useSupplierMarkupMap() without making additional API calls
 * because the data will be available in the cache.
 */
export function MarkupSyncer() {
  const { user } = useAuth();

  // Call the hook to fetch and cache markup data when user is authenticated
  // The enabled flag prevents API calls when user is not authenticated
  useSupplierMarkupMap(!!user);

  // This component doesn't render anything, it just manages the data fetching
  return null;
}
