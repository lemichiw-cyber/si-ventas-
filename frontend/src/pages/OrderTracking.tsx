import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../store/useAuth';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const statusSteps = [
  { key: 'pagado', label: 'Pedido Confirmado' },
  { key: 'enviado', label: 'Enviado' },
  { key: 'entregado', label: 'Entregado' },
];

const statusColors: Record<string, string> = {
  pagado: 'bg-rosa-pastel',
  enviado: 'bg-lila',
  entregado: 'bg-green-400',
  cancelado: 'bg-red-400',
  pendiente: 'bg-gray-300',
};

export default function OrderTracking() {
  const { user } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [searchedId, setSearchedId] = useState('');

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['order-tracking', searchedId],
    queryFn: async () => (await api.get(`/orders/${searchedId}/tracking`)).data,
    enabled: !!searchedId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      setSearchedId(orderId.trim());
    }
  };

  const getStepIndex = (estado: string) => {
    if (estado === 'entregado') return 2;
    if (estado === 'enviado') return 1;
    if (estado === 'pagado' || estado === 'pendiente') return 0;
    return -1;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-script text-4xl text-morado-oscuro text-center mb-8">Seguimiento de Pedido 📦</h1>

      {!user && (
        <p className="text-center text-sm text-gray-500 mb-6">
          Puedes buscar tu pedido sin iniciar sesión. También{' '}
          <Link to="/login" className="text-rosa-pastel font-semibold">
            inicia sesión
          </Link>{' '}
          para ver todos tus pedidos.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto mb-8">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="ID de tu orden (ej: a1b2c3d4...)"
          className="flex-1 border border-pink-100 rounded-full px-4 py-2 outline-none focus:border-lila"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-6 py-2 rounded-full font-semibold"
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {isError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-500"
        >
          Pedido no encontrado. Verifica el ID e intenta nuevamente.
        </motion.p>
      )}

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status timeline */}
          <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
            <h3 className="font-semibold text-morado-oscuro mb-4">Estado del envío</h3>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Estado actual</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColors[order.estado] || 'bg-gray-400'}`}
              >
                {order.estado}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {statusSteps.map((step, idx) => {
                const currentStep = getStepIndex(order.estado);
                const isActive = idx <= currentStep;
                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all ${
                        isActive ? 'bg-gradient-to-r from-rosa-pastel to-lila scale-110' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-sm ${isActive ? 'text-morado-oscuro font-semibold' : 'text-gray-400'}`}
                    >
                      {step.label}
                    </span>
                    {idx < statusSteps.length - 1 && (
                      <div
                        className={`h-0.5 w-12 transition-colors ${
                          isActive ? 'bg-gradient-to-r from-rosa-pastel to-lila' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {order.trackingNumber && (
              <div className="bg-lavanda-blush rounded-2xl p-4 text-center">
                <p className="text-sm text-morado-oscuro font-semibold mb-1">Número de tracking</p>
                <p className="font-mono text-lg text-morado-oscuro break-all">{order.trackingNumber}</p>
                {order.trackingCarrier && (
                  <p className="text-xs text-gray-500 mt-1">Carrier: {order.trackingCarrier}</p>
                )}
              </div>
            )}
          </div>

          {/* Order details */}
          <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
            <h3 className="font-semibold text-morado-oscuro mb-4">Detalles del pedido</h3>
            <p className="text-sm text-gray-500">
              Fecha: {new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500">Total: ${order.total.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Método de pago: {order.metodoPago}</p>
            {order.direccionEnvio && <p className="text-sm text-gray-500 mt-1">Dirección: {order.direccionEnvio}</p>}
          </div>

          {/* Items */}
          <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
            <h3 className="font-semibold text-morado-oscuro mb-4">Productos</h3>
            <div className="space-y-2 text-sm">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.nombre || item.product?.nombre || 'Producto'} x{item.cantidad}</span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {!order && !isError && !searchedId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-400 mt-12"
        >
          Ingresa el ID de tu orden para ver el estado de tu envío.
          <br />
          <span className="text-xs">Lo encuentras en el email de confirmación de tu compra.</span>
        </motion.div>
      )}
    </div>
  );
}
