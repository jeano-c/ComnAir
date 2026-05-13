import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { device } from "../api/devices";
import { useNavigate } from "react-router";

export function useDevices() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: devices, isLoading: isDevicesLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: device.getAllDevices,
  });

  const create = useMutation({
    mutationFn: device.createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });

  const update = useMutation({
    mutationFn: device.updateDevice,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
    },
  });

  const remove = useMutation({
    mutationFn: device.deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });

  return {
    devices,
    isDevicesLoading,

    createDevice: create.mutateAsync,
    isCreating: create.isPending,

    updateDevice: update.mutateAsync,
    isUpdating: update.isPending,

    deleteDevice: remove.mutateAsync,
    isDeleting: remove.isPending,
  };
}

export function useDevice(id: string | undefined) {
  const {
    data: deviceData,
    isLoading: isDeviceLoading,
    error,
  } = useQuery({
    queryKey: ["device", id],
    queryFn: () => device.getDeviceById(id!),
    enabled: !!id,
  });

  return {
    deviceData,
    isDeviceLoading,
    error,
  };
}
