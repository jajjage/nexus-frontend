"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/admin/useAdminCategories";
import { ProductCategory } from "@/types/product.types";
import {
  Edit,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  priority: string;
  isActive: boolean;
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  iconUrl: "",
  priority: "0",
  isActive: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toForm(category: ProductCategory): CategoryFormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    iconUrl: (category as ProductCategory & { iconUrl?: string }).iconUrl || "",
    priority: String(category.priority || 0),
    isActive: category.isActive !== false,
  };
}

export function CategoryManagementTable() {
  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
  } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return categories
      .filter((category) => {
        const matchesQuery =
          !normalizedQuery ||
          category.name.toLowerCase().includes(normalizedQuery) ||
          category.slug.toLowerCase().includes(normalizedQuery);
        const isActive = category.isActive !== false;
        const matchesStatus =
          status === "all" ||
          (status === "active" && isActive) ||
          (status === "inactive" && !isActive);

        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => {
        const priorityDiff = (left.priority || 0) - (right.priority || 0);
        return priorityDiff || left.name.localeCompare(right.name);
      });
  }, [categories, query, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const pageCategories = filteredCategories.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openCreateDialog = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (category: ProductCategory) => {
    setEditingCategory(category);
    setForm(toForm(category));
    setDialogOpen(true);
  };

  const updateForm = <K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      slug:
        key === "name" && !editingCategory && !current.slug
          ? slugify(String(value))
          : current.slug,
    }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      iconUrl: form.iconUrl.trim() || undefined,
      priority: Number(form.priority) || 0,
      isActive: form.isActive,
    };

    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        data: payload,
      });
    } else {
      await createCategory.mutateAsync(payload);
    }

    setDialogOpen(false);
  };

  const toggleCategory = async (category: ProductCategory) => {
    await updateCategory.mutateAsync({
      id: category.id,
      data: { isActive: category.isActive === false },
    });
  };

  const isSaving = createCategory.isPending || updateCategory.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load categories</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Product Categories
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name or slug"
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value: StatusFilter) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  pageCategories.map((category) => {
                    const isActive = category.isActive !== false;
                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-muted-foreground line-clamp-1 text-sm">
                              {category.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {category.slug}
                        </TableCell>
                        <TableCell>{category.priority || 0}</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => toggleCategory(category)}
                              disabled={updateCategory.isPending}
                            >
                              {isActive ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-muted-foreground flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {pageCategories.length} of {filteredCategories.length}{" "}
              categor{filteredCategories.length === 1 ? "y" : "ies"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitForm}>
            <div className="grid gap-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={form.slug}
                onChange={(event) =>
                  updateForm("slug", slugify(event.target.value))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-icon">Icon URL</Label>
              <Input
                id="category-icon"
                value={form.iconUrl}
                onChange={(event) => updateForm("iconUrl", event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category-priority">Priority</Label>
                <Input
                  id="category-priority"
                  type="number"
                  value={form.priority}
                  onChange={(event) =>
                    updateForm("priority", event.target.value)
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <Label htmlFor="category-active">Active</Label>
                <Switch
                  id="category-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => updateForm("isActive", checked)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
