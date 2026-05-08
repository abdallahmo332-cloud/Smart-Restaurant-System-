// src/pages/AdminLogin/AdminLogin.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const AdminLogin = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) setGeneralError('');
  };

  const validateForm = () => {
    const newErrors = {};
    const { email, password } = formData;

    if (!email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (password.length < 8)
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/login/`,
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const { token, user } = res.data;

      if (!user.role || user.role !== 'SYSTEM_ADMIN') {
        setGeneralError('هذا الحساب لا يملك صلاحية مدير النظام.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      alert('تم تسجيل الدخول كمدير النظام بنجاح!');

      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(); //
      }

    } catch (err) {
      console.error('Admin login error:', err);

      let msg = 'فشل تسجيل الدخول، تحقق من البيانات.';

      if (err.response?.data) {
        const { data } = err.response;
        if (data.detail) msg = data.detail;
        if (data.non_field_errors) msg = data.non_field_errors[0];
      }

      setGeneralError(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url('https://www.contemporist.com/wp-content/uploads/2022/02/dark-restaurant-interior-wood-accents-led-lighting-010222-719-03.jpg')`,
      }}
    >
      <div className="absolute inset-0 bg-black opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-black to-orange-950/40"></div>

      <div className="relative z-10 bg-black/97 border-4 border-red-800 p-12 md:p-20 rounded-3xl shadow-2xl w-full max-w-2xl mx-6 text-center">
        
        <h2 className="text-4xl md:text-5xl font-extrabold text-red-500 mb-16">
          تسجيل دخول مدير النظام
        </h2>

        <form onSubmit={handleSubmit} className="space-y-12">

          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-2xl font-bold text-gray-100 mb-4">البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-10 py-6 text-2xl rounded-2xl bg-gray-900 border-4 text-white placeholder-gray-600 ${
                errors.email ? 'border-red-500 ring-8 ring-red-500/60' : 'border-red-800'
              }`}
              placeholder="admin@example.com"
            />
            {errors.email && <p className="text-red-400 mt-3">{errors.email}</p>}
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-2xl font-bold text-gray-100 mb-4">كلمة المرور</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-10 py-6 text-2xl rounded-2xl bg-gray-900 border-4 text-white placeholder-gray-600 ${
                errors.password ? 'border-red-500 ring-8 ring-red-500/60' : 'border-red-800'
              }`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 mt-3">{errors.password}</p>}
          </div>

          {generalError && (
            <div className="bg-red-900/95 border-4 border-red-600 text-red-100 px-8 py-6 rounded-2xl text-xl font-bold">
              {generalError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-10 text-3xl font-extrabold text-white bg-gradient-to-r from-red-800 to-black hover:scale-105 transition rounded-3xl border-4 border-red-600"
          >
            {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
