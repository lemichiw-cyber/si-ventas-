import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../store/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('cliente@test.com');
  const [password, setPassword] = useState('Cliente123!');
  const setAuth = useAuth(s => s.setAuth);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.accessToken);
      nav('/');
    } catch (err: any) { alert(err.response?.data?.error || 'Error'); }
  };
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-[32px] p-8 shadow-soft border border-pink-50">
        <h1 className="font-script text-3xl text-morado-oscuro text-center">Bienvenida de vuelta 💖</h1>
        <form onSubmit={submit} className="space-y-4 mt-6">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border border-pink-100 rounded-full px-4 py-3" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full border border-pink-100 rounded-full px-4 py-3" />
          <button className="w-full bg-gradient-to-r from-rosa-pastel to-lila text-white py-3 rounded-full font-semibold">Entrar ✨</button>
        </form>
        <p className="text-center text-sm mt-4">¿No tienes cuenta? <Link to="/registro" className="text-rosa-pastel font-semibold">Regístrate</Link></p>
        <p className="text-xs text-center text-gray-400 mt-2">Admin: admin@dulceencanto.com / Admin123!</p>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ email: '', password: '', nombre: '', apellido: '', telefono: '', direccion: '' });
  const setAuth = useAuth(s => s.setAuth);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', form);
      setAuth(res.data.user, res.data.accessToken);
      nav('/');
    } catch (err: any) { alert(err.response?.data?.error || 'Error'); }
  };
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-[32px] p-8 shadow-soft border border-pink-50">
        <h1 className="font-script text-3xl text-morado-oscuro text-center">Crear cuenta 🌸</h1>
        <form onSubmit={submit} className="space-y-3 mt-6">
          {[
            ['email', 'Email'], ['password', 'Contraseña'], ['nombre', 'Nombre'], ['apellido', 'Apellido'], ['telefono', 'Teléfono'], ['direccion', 'Dirección'],
          ].map(([k, label]) => (
            <input key={k} type={k==='password'?'password':'text'} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={label} className="w-full border border-pink-100 rounded-full px-4 py-3" required={['email','password','nombre','apellido'].includes(k)} />
          ))}
          <button className="w-full bg-gradient-to-r from-rosa-pastel to-lila text-white py-3 rounded-full font-semibold">Registrarme 💜</button>
        </form>
        <p className="text-center text-sm mt-4">¿Ya tienes cuenta? <Link to="/login" className="text-rosa-pastel font-semibold">Login</Link></p>
      </div>
    </div>
  );
}
