import axios from "axios";

const API_URL = import.meta.env.VITE_BACK_END;
const getToken = () => localStorage.getItem("access_token");

// You can replace these with your actual DTO types if you have them exported
export interface CreateDevicePayload {
  [key: string]: any;
}

export interface UpdateDevicePayload {
  [key: string]: any;
}

export const device = {
  async createDevice(data: CreateDevicePayload) {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/device`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Adjust this based on your NestJS return structure (e.g., res.data vs res.data.data)
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Creating device failed");
    }
  },

  async getAllDevices() {
    try {
      const res = await axios.get(`${API_URL}/device`);
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Fetching devices failed");
    }
  },

  async getDeviceById(id: string) {
    try {
      const res = await axios.get(`${API_URL}/device/${id}`);
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Fetching device failed");
    }
  },

  async updateDevice({ id, data }: { id: string; data: UpdateDevicePayload }) {
    try {
      const res = await axios.patch(`${API_URL}/device/${id}`, data);
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Updating device failed");
    }
  },

  async deleteDevice(id: string) {
    try {
      const res = await axios.delete(`${API_URL}/device/${id}`);
      return res.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Deleting device failed");
    }
  },
};
