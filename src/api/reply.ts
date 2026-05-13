import axios from "axios";

const API_URL = import.meta.env.VITE_BACK_END;
const getToken = () => localStorage.getItem("access_token");

export const reply = {
  async createReply({
    content,
    reportId,
  }: {
    content: string;
    reportId: number;
  }) {
    try {
      const token = getToken();
      const res = await axios.post(
        `${API_URL}/reply`,
        { content, reportId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return res.data.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.message || "Replying failed");
    }
  },
};
