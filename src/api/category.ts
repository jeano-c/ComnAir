import axios from "axios";

const API_URL = import.meta.env.VITE_BACK_END;

const getToken = () => localStorage.getItem("access_token");

// Helper to attach the Bearer token
const getHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Types (You can move these to a separate types file)
export interface CreateCategoryDto {
  categoryType: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export const categoryApi = {
  async create(data: CreateCategoryDto) {
    try {
      const res = await axios.post(`${API_URL}/category`, data, {
        headers: getHeaders(),
      });
      return res.data; // Add .data again if your NestJS response is wrapped
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create category",
      );
    }
  },

  async findAll() {
    try {
      const res = await axios.get(`${API_URL}/category`, {
        headers: getHeaders(),
      });
      return res.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch categories",
      );
    }
  },

  async findOne(id: number) {
    try {
      const res = await axios.get(`${API_URL}/category/${id}`);
      return res.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch category",
      );
    }
  },

  async update({ id, data }: { id: number; data: UpdateCategoryDto }) {
    try {
      const res = await axios.patch(`${API_URL}/category/${id}`, data, {
        // Even though your controller didn't explicitly have AuthGuard on PATCH,
        // it's usually best practice to include the token for updates.
        headers: getHeaders(),
      });
      return res.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update category",
      );
    }
  },

  async remove(id: number) {
    try {
      const res = await axios.delete(`${API_URL}/category/${id}`, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete category",
      );
    }
  },
};
