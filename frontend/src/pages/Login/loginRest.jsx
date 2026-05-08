// src/pages/RestaurantLogin/RestaurantLogin.jsx

import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";
const LOGIN_ENDPOINT = "/auth/login/";

const RestaurantLogin = ({ onLoginSuccess, onGoToRestaurantSignup }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // ================== Handle input ==================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (generalError) setGeneralError("");
  };

  // ================== Validation ==================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================== Submit ==================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}${LOGIN_ENDPOINT}`,
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const token = res.data.token || res.data.key;
      if (!token) {
        setGeneralError("Login failed: token not returned from server");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", "MANAGER");

      if (typeof onLoginSuccess === "function") onLoginSuccess();
    } catch (err) {
      const status = err?.response?.status;

      if (status === 400 || status === 401) {
        setGeneralError("Invalid email or password");
      } else if (status === 403) {
        setGeneralError("You are not allowed to login as restaurant manager");
      } else {
        setGeneralError("Server error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-8 py-5 text-xl rounded-2xl bg-gray-900/40 border-2 border-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-500/40 transition";

  const labelClass = "block text-xl text-gray-100 mb-3";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://www.contemporist.com/wp-content/uploads/2022/02/dark-restaurant-interior-wood-accents-led-lighting-010222-719-03.jpg')",
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl mx-6 text-center">
        {/* Logo */}
        <img
          src="./logo.png"
          alt="Tabaaq Logo"
          className="mx-auto mb-10 w-64 rounded-2xl shadow-xl"
        />

        {/* Title */}
        <h2 className="text-5xl font-extrabold text-white mb-12 drop-shadow-2xl">
          Restaurant Manager Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-10 text-left">
          {/* Email */}
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.email && <p className="text-red-400 mt-2">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.password && (
              <p className="text-red-400 mt-2">{errors.password}</p>
            )}
          </div>

          {/* General error */}
          {generalError && (
            <div className="bg-red-900/80 text-red-100 p-4 rounded-xl text-center text-xl">
              {generalError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-2xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 rounded-2xl shadow-xl transition transform hover:scale-105"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Links */}
        <div className="text-center mt-10 space-y-6">
          <a
            href="#"
            className="block text-orange-400 hover:text-orange-300 text-xl font-medium underline"
          >
            Forgot your password?
          </a>

          <p className="text-gray-200 text-xl">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={() =>
                typeof onGoToRestaurantSignup === "function" &&
                onGoToRestaurantSignup()
              }
              className="text-orange-400 font-bold underline"
            >
              Request restaurant account
            </button>
          </p>

          <a href="/" className="block text-gray-300 hover:text-white text-xl">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
};

export default RestaurantLogin;
