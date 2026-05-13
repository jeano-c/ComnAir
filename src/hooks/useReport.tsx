import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { reports } from "../api/reports";

export function useReport(id: number) {
  const query = useQuery({
    queryKey: ["report", id],
    queryFn: () => reports.getOne(id!),
    enabled: !!id,
  });

  return {
    reportData: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetchReport: query.refetch,
  };
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      resolve,
    }: {
      id: number;
      status: string;
      resolve: boolean;
    }) => reports.update(id, { status, resolve }),

    onMutate: async ({ id, status, resolve }) => {
      await queryClient.cancelQueries({ queryKey: ["report", id] });
      const previousReport = queryClient.getQueryData(["report", id]);
      queryClient.setQueryData(["report", id], (old: any) => ({
        ...old,
        status,
        resolve,
      }));
      return { previousReport, id };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousReport) {
        queryClient.setQueryData(
          ["report", context.id],
          context.previousReport,
        );
      }
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["report", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      // ✅ This is what makes history refresh without a reload
      queryClient.invalidateQueries({
        queryKey: ["report-history", variables.id],
      });
    },
  });
}
export function useReportHistory(id: number) {
  const query = useQuery({
    queryKey: ["report-history", id],
    queryFn: () => reports.getHistory(id),
    enabled: !!id,
  });

  return {
    history: query.data?.history ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
