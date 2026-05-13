import axios from "axios";

const API_URL = import.meta.env.VITE_BACK_END;
const getToken = () => localStorage.getItem("access_token");

export const reports = {
  async getAll(page: number = 1, pageSize: number = 20) {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/reports`, {
        params: {
          page: page,
          pageSize: pageSize,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Failed to fetch reports");
    }
  },

  async getOne(id: number) {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Failed to fetch report");
    }
  },
  async update(id: number, data: { status?: string; resolve?: boolean }) {
    try {
      const token = getToken();
      const res = await axios.patch(`${API_URL}/reports/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.data || res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Failed to update report");
    }
  },
  async getDuplicates(
    threshold = 0.6,
    topK = 10,
    limit = 20,
    includeSingletons = true,
  ) {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/reports/duplicates`, {
        params: { threshold, topK, limit, includeSingletons },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (e: any) {
      throw new Error(
        e.response?.data?.message || "Failed to fetch duplicates",
      );
    }
  },

  // In your reports api file, add inside the reports object:
  async getHistory(id: number) {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/reports/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data || res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Failed to fetch history");
    }
  },
};
