import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useNavigate } from "react-router";
export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: authApi.getProfile,
    refetchOnWindowFocus: false,
  });
  
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      localStorage.setItem("access_token", data.access_token);
      await queryClient.refetchQueries({ queryKey: ["authUser"] });
      navigate("/");
    },
  });

  const logout = () => {
    localStorage.removeItem("access_token");
    queryClient.setQueryData(["authUser"], null);
    navigate("/login");
  };

  const register = useMutation({
    mutationFn: authApi.register,
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isUserLoading,

    login: login.mutateAsync,
    isLoggingIn: login.isPending,

    register: register.mutateAsync,
    isRegistering: register.isPending,

    logout,
  };
}
