import React, { useState } from "react";
import { registerUser } from "../../services/api";

const Signup = ({ onGoToLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    full_name: "",
    phone: "",
    location: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (generalError) setGeneralError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Confirm password is required";
    } else if (formData.confirm_password !== formData.password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await registerUser(formData);

      const token = res.data?.token || res.data?.key;
      const user = res.data?.user || null;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("role", "USER");

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        if (typeof onGoToLogin === "function") {
          onGoToLogin();
        }

        return;
      }

      alert("Account created successfully!");

      if (typeof onGoToLogin === "function") {
        onGoToLogin();
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      const data = err.response?.data;

      const fieldErrors = {};
      let message = "Signup failed";

      if (data) {
        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) {
            if (key === "non_field_errors") {
              message = data[key][0];
            } else {
              fieldErrors[key] = data[key][0];
            }
          }
        });
      } else {
        message = "Server error, try again later";
      }

      setErrors((prev) => ({
        ...prev,
        ...fieldErrors,
      }));

      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-6 py-4 rounded-xl bg-gray-900/40 border-2 border-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-500/40 transition-all";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://www.contemporist.com/wp-content/uploads/2022/02/dark-restaurant-interior-wood-accents-led-lighting-010222-719-03.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 w-full max-w-4xl mx-6 text-center">
        <img
          src="./logo.png"
          alt="Tabaaq Logo"
          className="mx-auto mb-8 w-64 rounded-2xl shadow-xl"
        />

        <h2 className="text-5xl font-extrabold text-white mb-10 drop-shadow-2xl">
          Create a new account
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
        >
          <div>
            <label className="block text-lg text-gray-100 mb-2">
              Full name
            </label>

            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={inputClass}
            />

            {errors.full_name && (
              <p className="text-red-400 mt-1">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-lg text-gray-100 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
            />

            {errors.email && (
              <p className="text-red-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-lg text-gray-100 mb-2">
              Phone
            </label>

            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClass}
            />

            {errors.phone && (
              <p className="text-red-400 mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-lg text-gray-100 mb-2">
              Location
            </label>

            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={inputClass}
            />

            {errors.location && (
              <p className="text-red-400 mt-1">{errors.location}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-lg text-gray-100 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
            />

            {errors.password && (
              <p className="text-red-400 mt-1">{errors.password}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-lg text-gray-100 mb-2">
              Confirm password
            </label>

            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={inputClass}
            />

            {errors.confirm_password && (
              <p className="text-red-400 mt-1">
                {errors.confirm_password}
              </p>
            )}
          </div>

          {generalError && (
            <div className="md:col-span-2 bg-red-900/80 text-red-100 p-4 rounded-xl text-center">
              {generalError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full py-5 text-2xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 rounded-xl shadow-xl transition"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-gray-200 mt-10 text-lg">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() =>
              typeof onGoToLogin === "function"
                ? onGoToLogin()
                : (window.location.href = "/login")
            }
            className="text-orange-400 font-bold underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;