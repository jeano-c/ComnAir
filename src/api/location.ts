import axios from "axios";

const API_URL = import.meta.env.VITE_BACK_END;
const getToken = () => localStorage.getItem("access_token");

export interface CreateLocationPayload {
  [key: string]: any;
}

export interface UpdateLocationPayload {
  [key: string]: any;
}

export const location = {
  async createLocation(data: CreateLocationPayload) {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/location`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Creating location failed");
    }
  },

  async getAllLocations() {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/location`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Fetching locations failed");
    }
  },

  async getLocationById(id: number) {
    try {
      // No auth header since findOne doesn't use the AuthGuard in the controller
      const res = await axios.get(`${API_URL}/location/${id}`);
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Fetching location failed");
    }
  },

  async getLocationHistory(
    id: number,
    period: "day" | "week" | "month" | "year",
  ) {
    try {
      const res = await axios.get(`${API_URL}/location/${id}/history`, {
        params: { period },
      });
      return res.data;
    } catch (e: any) {
      throw new Error(
        e.response?.data?.message || "Fetching location history failed",
      );
    }
  },

  async updateLocation({
    id,
    data,
  }: {
    id: number;
    data: UpdateLocationPayload;
  }) {
    try {
      const token = getToken();
      const res = await axios.patch(`${API_URL}/location/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Updating location failed");
    }
  },

  async deleteLocation(id: number) {
    try {
      // No auth header since remove doesn't use the AuthGuard in the controller
      const res = await axios.delete(`${API_URL}/location/${id}`);
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Deleting location failed");
    }
  },
};
