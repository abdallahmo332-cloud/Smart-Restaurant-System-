// src/pages/Charity/CharitySignup.jsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function CharitySignup({ onSignupSuccess, onGoToLogin }) {
  const [formData, setFormData] = useState({
    charity_name: "",
    charity_address: "",
    charity_phone: "",
    manager_name: "",
    manager_email: "",
    manager_phone: "",
    manager_password: "",
  });

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

    if (!formData.charity_name.trim()) next.charity_name = "اسم الجمعية مطلوب";
    if (!formData.charity_address.trim()) next.charity_address = "عنوان الجمعية مطلوب";
    if (!formData.charity_phone.trim()) next.charity_phone = "هاتف الجمعية مطلوب";
    if (!formData.manager_name.trim()) next.manager_name = "اسم المدير مطلوب";

    if (!formData.manager_email.trim()) next.manager_email = "البريد الإلكتروني مطلوب";
    else if (!/^\S+@\S+\.\S+$/.test(formData.manager_email)) next.manager_email = "البريد الإلكتروني غير صالح";

    if (!formData.manager_phone.trim()) next.manager_phone = "هاتف المدير مطلوب";
    if (!formData.manager_password) next.manager_password = "كلمة المرور مطلوبة";
    else if (formData.manager_password.length < 8) next.manager_password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/charity/account-request/`, formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (typeof onSignupSuccess === "function") onSignupSuccess();
    } catch (err) {
      const data = err?.response?.data;
      let msg = "فشل إنشاء طلب الجمعية";

      if (data?.detail) msg = data.detail;
      else if (typeof data === "object") {
        const k = Object.keys(data)[0];
        if (k) msg = Array.isArray(data[k]) ? data[k][0] : data[k];
      }

      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://www.contemporist.com/wp-content/uploads/2022/02/dark-restaurant-interior-wood-accents-led-lighting-010222-719-03.jpg')" }}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-full max-w-2xl mx-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-10">إنشاء حساب جمعية خيرية</h2>

        <form onSubmit={handleSubmit} className="space-y-6 text-left bg-black/40 p-6 rounded-3xl border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="اسم الجمعية" name="charity_name" value={formData.charity_name} onChange={handleChange} error={errors.charity_name} />
            <Field label="عنوان الجمعية" name="charity_address" value={formData.charity_address} onChange={handleChange} error={errors.charity_address} />
            <Field label="هاتف الجمعية" name="charity_phone" value={formData.charity_phone} onChange={handleChange} error={errors.charity_phone} />
            <Field label="اسم المدير" name="manager_name" value={formData.manager_name} onChange={handleChange} error={errors.manager_name} />
            <Field label="بريد المدير" name="manager_email" type="email" value={formData.manager_email} onChange={handleChange} error={errors.manager_email} />
            <Field label="هاتف المدير" name="manager_phone" value={formData.manager_phone} onChange={handleChange} error={errors.manager_phone} />
            <div className="md:col-span-2">
              <Field label="كلمة مرور المدير" name="manager_password" type="password" value={formData.manager_password} onChange={handleChange} error={errors.manager_password} />
            </div>
          </div>

          {generalError && <div className="text-red-300 font-bold bg-red-900/60 p-4 rounded-2xl">{generalError}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-xl font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-2xl"
          >
            {loading ? "جاري الإرسال..." : "إرسال طلب الجمعية"}
          </button>

          <button
            type="button"
            onClick={() => typeof onGoToLogin === "function" && onGoToLogin()}
            className="w-full py-4 text-white border border-white/30 rounded-2xl"
          >
            العودة لتسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = "text" }) {
  return (
    <div>
      <label className="block text-white mb-2 font-bold">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-2xl bg-gray-900/60 border border-white/20 text-white outline-none"
      />
      {error && <p className="text-red-300 mt-1 text-sm">{error}</p>}
    </div>
  );
}