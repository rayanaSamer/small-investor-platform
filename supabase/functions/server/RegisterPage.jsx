import { useState } from 'react';
import { registerUser } from './registerUser';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', age: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await registerUser(form);
    setLoading(false);

    if (result) {
      alert('تم التسجيل بنجاح!');
      console.log(result);
    } else {
      alert('حدث خطأ أثناء التسجيل.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="الإيميل" type="email" required
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="كلمة المرور" type="password" required
        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <input placeholder="الاسم" type="text" required
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="رقم الجوال" type="text" required
        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="العمر" type="number" required min={5} max={80}
        value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
      <button type="submit" disabled={loading}>{loading ? 'جارٍ التسجيل...' : 'سجل الآن'}</button>
    </form>
  );
}