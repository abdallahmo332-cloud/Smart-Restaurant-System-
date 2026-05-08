// src/pages/RestaurantSignup/RestaurantSignup.jsx

import React, { useState } from "react";
import axios from "axios";

const RestaurantSignup = () => {
  const [formData, setFormData] = useState({
    managerName: "",
    restaurantName: "",
    phone: "",
    city: "",
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.managerName.trim()) newErrors.managerName = "Manager name is required";
    if (!formData.restaurantName.trim()) newErrors.restaurantName = "Restaurant name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.city.trim()) newErrors.city = "City / address is required";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email address";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSuccess(false);
    setErrors((prev) => ({ ...prev, general: "" }));

    console.log("Restaurant account request:", formData);

    try {
      const payload = {
        restaurant_name: formData.restaurantName,
        restaurant_address: formData.city,
        restaurant_phone: formData.phone,
        manager_name: formData.managerName,
        manager_email: formData.email,
        manager_phone: formData.phone,
      };

      const res = await axios.post(
        "http://localhost:8000/api/manager/account-request/",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Request created successfully:", res.data);

      setSuccess(true);
      setFormData({
        managerName: "",
        restaurantName: "",
        phone: "",
        city: "",
        email: "",
      });
      setErrors({});
    } catch (err) {
      console.error("Restaurant request error:", err);

      if (err.response && err.response.data) {
        const data = err.response.data;
        const fieldErrors = {};
        let general = "";

        Object.keys(data).forEach((key) => {
          const value = Array.isArray(data[key]) ? data[key][0] : data[key];

          switch (key) {
            case "restaurant_name":
              fieldErrors.restaurantName = value;
              break;
            case "restaurant_address":
              fieldErrors.city = value;
              break;
            case "restaurant_phone":
              fieldErrors.phone = value;
              break;
            case "manager_name":
              fieldErrors.managerName = value;
              break;
            case "manager_email":
              fieldErrors.email = value;
              break;
            case "manager_phone":
              fieldErrors.phone = value;
              break;
            case "non_field_errors":
            case "detail":
              general = value;
              break;
            default:
              general = general || "Failed to submit request. Please try again.";
          }
        });

        setErrors((prev) => ({ ...prev, ...fieldErrors, general }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "Network error. Please check your connection and try again.",
        }));
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
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 w-full max-w-3xl mx-6 text-center">
        <img
          src="./logo.png"
          alt="Tabaaq Logo"
          className="mx-auto mb-10 w-64 rounded-2xl shadow-xl"
        />

        <h2 className="text-5xl font-extrabold text-white mb-12 drop-shadow-2xl">
          Restaurant Account Request
        </h2>

        {success ? (
          <div className="text-center py-10">
            <div className="text-green-400 text-5xl mb-6 font-bold">Submitted Successfully!</div>
            <div className="text-xl text-gray-200 space-y-2 leading-relaxed">
              <p>Your request has been sent to the system admin.</p>
              <p>It will be reviewed shortly.</p>
              <p>You will be contacted by email after approval.</p>
            </div>

            <a
              href="/"
              className="inline-block mt-10 px-12 py-5 bg-orange-600 hover:bg-orange-700 text-white text-2xl font-bold rounded-2xl shadow-2xl transition transform hover:scale-105"
            >
              Back to Home
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Manager name</label>
                <input
                  type="text"
                  name="managerName"
                  value={formData.managerName}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.managerName && <p className="text-red-400 mt-2">{errors.managerName}</p>}
              </div>

              <div>
                <label className={labelClass}>Restaurant name</label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.restaurantName && (
                  <p className="text-red-400 mt-2">{errors.restaurantName}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                  dir="ltr"
                />
                {errors.phone && <p className="text-red-400 mt-2">{errors.phone}</p>}
              </div>

              <div>
                <label className={labelClass}>City / Address</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.city && <p className="text-red-400 mt-2">{errors.city}</p>}
              </div>

              <div className="md:col-span-2">
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
            </div>

            {errors.general && (
              <div className="bg-red-900/80 text-red-100 p-4 rounded-xl text-center text-xl">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-2xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 rounded-2xl shadow-xl transition transform hover:scale-105"
            >
              {loading ? "Submitting..." : "Submit request"}
            </button>
          </form>
        )}

        <p className="text-center text-gray-200 mt-10 text-xl">
          <a href="/" className="text-orange-400 font-bold underline">
            ← Back to Home
          </a>
        </p>
      </div>
    </div>
  );
};

export default RestaurantSignup;
