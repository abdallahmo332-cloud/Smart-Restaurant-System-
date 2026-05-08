// src/pages/Charity/CharityLogin.jsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function CharityLogin({ onLoginSuccess, onGoToSignup, onGoToLogin }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (generalError) setGeneralError("");
  };

  const validateForm = () => {
    const next = {};
    if (!formData.email.trim()) next.email = "البريد الإلكتروني مطلوب";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) next.email = "البريد الإلكتروني غير صالح";

    if (!formData.password) next.password = "كلمة المرور مطلوبة";
    else if (formData.password.length < 6) next.password = "كلمة المرور قصيرة";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/login/`,
        { email: formData.email.trim(), password: formData.password },
        { headers: { "Content-Type": "application/json" } }
      );

      const token = res.data.token || res.data.key;
      const user = res.data.user;

      if (!token) {
        setGeneralError("لم يتم إرجاع token من السيرفر");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", user?.role || "CHARITY");
      localStorage.setItem("user", JSON.stringify(user || {}));

      if (typeof onLoginSuccess === "function") onLoginSuccess();
    } catch (err) {
      const data = err?.response?.data;
      let msg = "فشل تسجيل الدخول";
      if (data?.detail) msg = data.detail;
      else if (data?.non_field_errors?.length) msg = data.non_field_errors[0];
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://www.contemporist.com/wp-content/uploads/2022/02/dark-restaurant-interior-wood-accents-led-lighting-010222-719-03.jpg')" }}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-full max-w-xl mx-6 text-center">
        <h2 className="text-5xl font-extrabold text-white mb-12">تسجيل دخول الجمعية</h2>

        <form onSubmit={handleSubmit} className="space-y-8 text-left">
          <Field label="البريد الإلكتروني" name="email" value={formData.email} onChange={handleChange} error={errors.email} type="email" />
          <Field label="كلمة المرور" name="password" value={formData.password} onChange={handleChange} error={errors.password} type="password" />

          {generalError && <div className="bg-red-900/80 text-red-100 p-4 rounded-xl text-center font-bold">{generalError}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-2xl font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-2xl"
          >
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => typeof onGoToSignup === "function" && onGoToSignup()}
            className="block w-full text-orange-400 font-bold underline"
          >
            إنشاء حساب جمعية جديدة
          </button>

          <button
            type="button"
            onClick={() => typeof onGoToLogin === "function" && onGoToLogin()}
            className="block w-full text-white/70 underline"
          >
            العودة لتسجيل الدخول العام
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = "text" }) {
  return (
    <div>
      <label className="block text-xl text-gray-100 mb-3">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-8 py-5 text-xl rounded-2xl bg-gray-900/40 border-2 border-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-500/40 transition"
      />
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
}