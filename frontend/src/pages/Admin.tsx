import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../store/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  if (!user || user.rol !== 'admin') return <p className="p-8 text-center">Acceso denegado. Inicia como admin@dulceencanto.com</p>;

  const products = useQuery({ queryKey: ['admin-products'], queryFn: async () => (await api.get('/products?limit=50')).data });
  const orders = useQuery({ queryKey: ['admin-orders'], queryFn: async () => (await api.get('/orders')).data });

  const [form, setForm] = useState({ nombre: '', slug: '', descripcion: '', precio: 2.5, costoProduccion: 1.7, categoriaId: '', pesoNeto: '250g' });

  const createMut = useMutation({
    mutationFn: async (data: any) => (await api.post('/products', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const updateStatus = async (id: string, estado: string) => {
    await api.put(`/orders/${id}/status`, { estado });
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
  };

  const lowStock = products.data?.data?.filter((p: any) => p.stock < 20) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-script text-4xl text-morado-oscuro">Panel Admin 👑</h1>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-pink-50"><p className="text-sm text-gray-500">Total Productos</p><p className="text-2xl font-bold">{products.data?.total || 0}</p></div>
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-pink-50"><p className="text-sm text-gray-500">Órdenes</p><p className="text-2xl font-bold">{orders.data?.length || 0}</p></div>
        <div className="bg-white rounded-2xl p-4 shadow-soft border-pink-50 border"><p className="text-sm text-gray-500">Stock bajo (&lt;20)</p><p className="text-2xl font-bold text-red-400">{lowStock.length}</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
          <h3 className="font-semibold">Crear Producto</h3>
          <form onSubmit={e => { e.preventDefault(); createMut.mutate({ ...form, stock: 100, imagenPrincipal: 'https://via.placeholder.com/400' }); }} className="space-y-2 mt-4">
            <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full border rounded-full px-3 py-2" required />
            <input placeholder="Slug (ej: mermelada-nueva)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full border rounded-full px-3 py-2" required />
            <textarea placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="w-full border rounded-2xl px-3 py-2" required />
            <div className="flex gap-2"><input type="number" step="0.01" value={form.precio} onChange={e => setForm({ ...form, precio: parseFloat(e.target.value) })} className="flex-1 border rounded-full px-3 py-2" /><input type="number" step="0.01" value={form.costoProduccion} onChange={e => setForm({ ...form, costoProduccion: parseFloat(e.target.value) })} className="flex-1 border rounded-full px-3 py-2" /></div>
            <input placeholder="categoriaId (usa slug cat: busca en DB)" value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })} className="w-full border rounded-full px-3 py-2" />
            <p className="text-xs text-gray-400">Tip: categorías: fresa, mora, durazno, zarzamora, mixtas - el ID lo puedes copiar del listado abajo</p>
            <button className="w-full bg-morado-oscuro text-white py-2 rounded-full">Crear</button>
          </form>
          <div className="mt-6 max-h-64 overflow-auto text-xs">
            {products.data?.data?.map((p: any) => <div key={p.id} className="flex justify-between py-1 border-b"><span>{p.nombre} - {p.id.slice(0,6)}... - stock {p.stock}</span></div>)}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
          <h3 className="font-semibold">Órdenes Recientes</h3>
          <div className="space-y-3 mt-4 max-h-[500px] overflow-auto">
            {orders.data?.map((o: any) => (
              <div key={o.id} className="border border-pink-50 rounded-2xl p-3">
                <div className="flex justify-between"><span className="font-mono text-xs">{o.id.slice(0,8)}</span><span className="text-xs bg-lavanda-blush px-2 py-1 rounded-full">{o.estado}</span></div>
                <p className="text-sm">Total: ${o.total.toFixed(2)} - {o.items.length} items</p>
                <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
                <div className="flex gap-1 mt-2">
                  {['pagado','enviado','entregado','cancelado'].map(s => <button key={s} onClick={() => updateStatus(o.id, s)} className="text-xs border px-2 py-1 rounded-full hover:bg-lavanda-blush">{s}</button>)}
                </div>
              </div>
            ))}
            {orders.data?.length === 0 && <p className="text-sm text-gray-400">Sin órdenes aún</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
