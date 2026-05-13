import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reply } from "../api/reply";

export function useReply(reportId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reply.createReply,
    onMutate: async (newReply) => {
      // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
      // FIX: Changed "reports" to "report" to match useReport
      await queryClient.cancelQueries({ queryKey: ["report", reportId] });

      // 2. Snapshot the current data
      // FIX: Changed "reports" to "report"
      const previousData = queryClient.getQueryData(["report", reportId]);

      // 3. Optimistically update the cache
      // FIX: Changed "reports" to "report"
      queryClient.setQueryData(["report", reportId], (old: any) => {
        if (!old) return old;

        // Flat update because your Axios setup strips the wrapper
        return {
          ...old,
          resolve: true, // Triggers the UI switch instantly
          status: "Resolved",
          reply: {
            id: Math.random(), // Temporary ID
            content: newReply.content, // The HTML from Quill
            createdAt: new Date().toISOString(),
            user: {
              email: "Support (Optimistic)", // Visual cue it's sending
            },
          },
        };
      });

      // 4. Return context for rollback
      return { previousData };
    },
    onError: (err, _, context) => {
      // Rollback if the server says "no"
      if (context?.previousData) {
        // FIX: Changed "reports" to "report"
        queryClient.setQueryData(["report", reportId], context.previousData);
      }
    },
    onSettled: () => {
      // Refresh to get the real DB data and ID once the request finishes
      // FIX: Changed "reports" to "report" for the specific item
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });

      // Leave this one plural, assuming your main list uses ["reports"]
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
