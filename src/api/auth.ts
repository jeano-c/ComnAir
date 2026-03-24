import axios from "axios";
const API_URL = import.meta.env.VITE_BACK_END;

const getToken = () => localStorage.getItem("access_token");

export const authApi = {
  async register(data: Register) {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/auth/register`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Registration failed"
      );
    }
  },

  async login(loginData: LoginData) {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, loginData);
      return res.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  },

  async getProfile() {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error: any) {
      localStorage.removeItem("access_token");
      throw new Error(error.response?.data?.message || "Session expired");
    }
  },
};
