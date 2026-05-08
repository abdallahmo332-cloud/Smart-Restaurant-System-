import axios from "axios";

/*
|--------------------------------------------------------------------------
| Base URL
|--------------------------------------------------------------------------
| غيّر هذا لاحقًا إذا رفعت الباك على سيرفر
*/
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
| يضيف التوكن تلقائيًا إذا موجود
*/
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
| إذا انتهت الجلسة يحذف التوكن
*/
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| Auth APIs
|--------------------------------------------------------------------------
*/
export const loginUser = (data) =>
  API.post("auth/login/", data);

export const registerUser = (data) =>
  API.post("auth/register/", data);

/*
|--------------------------------------------------------------------------
| Restaurants APIs
|--------------------------------------------------------------------------
*/
export const getRestaurants = () =>
  API.get("restaurants/");

export const getRestaurantDetails = (id) =>
  API.get(`restaurants/${id}/`);

export const getRestaurantTypes = () =>
  API.get("restaurants/types/");

/*
|--------------------------------------------------------------------------
| Reservations APIs
|--------------------------------------------------------------------------
*/
export const createReservation = (data) =>
  API.post("reservations/", data);

export const getMyReservations = () =>
  API.get("reservations/my/");

/*
|--------------------------------------------------------------------------
| Orders APIs
|--------------------------------------------------------------------------
*/
export const createOrder = (data) =>
  API.post("orders/", data);

export const getMyOrders = () =>
  API.get("orders/my/");

/*
|--------------------------------------------------------------------------
| AI Recommendation APIs
|--------------------------------------------------------------------------
*/
export const getRecommendations = (data = {}) =>
  API.post("recommendations/meals/", data);

/*
|--------------------------------------------------------------------------
| Chatbot APIs
|--------------------------------------------------------------------------
*/
export const sendChatMessage = (message, context_text = "") =>
  API.post("chatbot/", {
    message,
    context_text,
  });

/*
|--------------------------------------------------------------------------
| Restaurant Manager APIs
|--------------------------------------------------------------------------
*/
export const getManagerMenuItems = () =>
  API.get("manager/menu-items/");

export const createManagerMenuItem = (data) =>
  API.post("manager/menu-items/", data);

export const updateManagerMenuItem = (id, data) =>
  API.patch(`manager/menu-items/${id}/`, data);

export const deleteManagerMenuItem = (id) =>
  API.delete(`manager/menu-items/${id}/`);

/*
|--------------------------------------------------------------------------
| Export Default
|--------------------------------------------------------------------------
*/
export default API;