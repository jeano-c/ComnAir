import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { categoryApi } from "../api/category";
export function useCategory() {
  const queryClient = useQueryClient();

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.findAll,
  });

  const createCategory = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: categoryApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const removeCategory = useMutation({
    mutationFn: categoryApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    // Queries
    categories,
    isCategoriesLoading,

    // Mutations
    createCategory: createCategory.mutateAsync,
    isCreating: createCategory.isPending,

    updateCategory: updateCategory.mutateAsync,
    isUpdating: updateCategory.isPending,

    removeCategory: removeCategory.mutateAsync,
    isRemoving: removeCategory.isPending,
  };
}

export function useCategoryDetail(id: number | undefined) {
  const { data: category, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["category", id],
    queryFn: () => categoryApi.findOne(id!),
    enabled: !!id,
  });

  return {
    category,
    isCategoryLoading,
  };
}
