import axios from "axios";

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


