import React, { useState } from "react";
import { loginUser } from "../../services/api";

const Login = ({ onLoginSuccess, onGoToSignup }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

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
    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      const token = res.data.token || res.data.key;
      const user = res.data.user || null;
      const role = user?.role || "USER";

      if (!token) {
        setGeneralError("Login failed: token not returned");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(user);
      }
    } catch (err) {
      const data = err.response?.data;

      let message = "Login failed. Please check your credentials.";

      if (data?.detail) message = data.detail;
      else if (data?.error) message = data.error;
      else if (data?.non_field_errors?.length) {
        message = data.non_field_errors[0];
      }

      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-8 py-5 text-xl rounded-2xl bg-gray-900/40 border-2 border-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-500/40 transition";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://www.contemporist.com/wp-content/uploads/2022/02/dark-restaurant-interior-wood-accents-led-lighting-010222-719-03.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 w-full max-w-xl mx-6 text-center">
        <img
          src="./logo.png"
          alt="Logo"
          className="mx-auto mb-10 w-64 rounded-2xl shadow-xl"
        />

        <h2 className="text-5xl font-extrabold text-white mb-12 drop-shadow-2xl">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-10 text-left">
          <div>
            <label className="block text-xl text-gray-100 mb-3">
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
              <p className="text-red-400 mt-2">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xl text-gray-100 mb-3">
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
              <p className="text-red-400 mt-2">{errors.password}</p>
            )}
          </div>

          {generalError && (
            <div className="bg-red-900/80 text-red-100 p-4 rounded-xl text-center text-xl">
              {generalError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-2xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 rounded-2xl shadow-xl transition transform hover:scale-105"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-200 mt-10 text-xl">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() =>
              typeof onGoToSignup === "function" && onGoToSignup()
            }
            className="text-orange-400 font-bold underline"
          >
            Create a new account
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;