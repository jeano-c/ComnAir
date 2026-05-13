import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { location } from "../api/location"; // Adjust the import path as needed

// Hook for fetching the list of locations and handling mutations
export function useLocations() {
  const queryClient = useQueryClient();

  // 1. Fetch all locations
  const {
    data: locations,
    isLoading: isLocationsLoading,
    error: locationsError,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: location.getAllLocations,
  });

  // 2. Create location mutation
  const create = useMutation({
    mutationFn: location.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  // 3. Update location mutation
  const update = useMutation({
    mutationFn: location.updateLocation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      // Invalidate the specific location cache as well
      queryClient.invalidateQueries({ queryKey: ["location", variables.id] });
    },
  });

  // 4. Delete location mutation
  const remove = useMutation({
    mutationFn: location.deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  return {
    locations,
    isLocationsLoading,
    locationsError,

    createLocation: create.mutateAsync,
    isCreating: create.isPending,

    updateLocation: update.mutateAsync,
    isUpdating: update.isPending,

    deleteLocation: remove.mutateAsync,
    isDeleting: remove.isPending,
  };
}

// Hook for fetching a single location by ID
export function useLocation(id: number | undefined) {
  const {
    data: locationData,
    isLoading: isLocationLoading,
    error,
  } = useQuery({
    queryKey: ["location", id],
    queryFn: () => location.getLocationById(id!),
    // Ensure the query only runs if a valid number is provided
    enabled: id !== undefined && id !== null && !isNaN(id),
  });

  return {
    locationData,
    isLocationLoading,
    error,
  };
}

export function useLocationHistory(
  id: number | undefined,
  period: "day" | "week" | "month" | "year",
) {
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useQuery({
    queryKey: ["locationHistory", id, period],
    queryFn: () => location.getLocationHistory(id!, period),
    enabled: id !== undefined && id !== null && !isNaN(id),
  });

  return {
    historyData,
    isHistoryLoading,
    historyError,
  };
}
