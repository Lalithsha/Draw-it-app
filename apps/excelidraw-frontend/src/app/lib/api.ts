import axios from "axios";
import { toast } from "../hooks/use-toast";

export const api = axios.create({
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);
    if (error.response && error.response.status === 401) {
      try {
        original._retry = true;
        await api.post(`http://localhost:3001/api/v1/user/refresh`, {});
        return api.request(original);
      } catch (e) {
        console.log("Error in axios request: ", e);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.message ===
        "Invalid/expired token, please re-authenticate"
    ) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      // a small delay to allow the user to see the toast
      setTimeout(() => {
        window.location.href = "/signin";
      }, 2000);
    }
    return Promise.reject(error);
  }
);

export default api;


