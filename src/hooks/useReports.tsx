import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { reports } from "../api/reports";

export function useReports(pageSize: number = 20) {
  const query = useInfiniteQuery({
    queryKey: ["reports"],
    queryFn: ({ pageParam = 1 }) => reports.getAll(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.items?.length === pageSize
        ? allPages.length + 1
        : undefined;
    },
  });

  const allReports =
    query.data?.pages.flatMap((page: any) => page.items || page) || [];
  return {
    reportsData: allReports,
    isLoading: query.isLoading,
    isError: query.isError,

    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
export function useDuplicates(isEnabled: boolean) {
  return useQuery({
    queryKey: ["reports", "duplicates"],
    queryFn: () => reports.getDuplicates(0.6, 10, 20, true),
    enabled: isEnabled, // 🚀 Now it will only fetch when told to!
  });
}
