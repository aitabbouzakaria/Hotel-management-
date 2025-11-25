import React, { useState } from 'react';
import { Hotel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthForm() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <div className="flex items-center gap-2 mb-4"><Hotel /> <h1>Hotel Manager</h1></div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          {!isLogin && <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded" />}
          <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="w-full p-2 border rounded" required/>
          <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="w-full p-2 border rounded" required/>
          <button className="w-full bg-blue-600 text-white p-2 rounded">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <div className="text-sm mt-2">
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600">{isLogin ? 'Create account' : 'Back to login'}</button>
        </div>
      </div>
    </div>
  );
}