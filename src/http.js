export class HttpError extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export class Router {
  constructor() {
    this.rutas = [];
  }
  add(metodo, patron, ...manejadores) {
    const partes = patron.split('/').filter(Boolean);
    this.rutas.push({ metodo: metodo.toUpperCase(), partes, manejadores });
  }
  get(p, ...h) { this.add('GET', p, ...h); }
  post(p, ...h) { this.add('POST', p, ...h); }
  put(p, ...h) { this.add('PUT', p, ...h); }
  patch(p, ...h) { this.add('PATCH', p, ...h); }
  delete(p, ...h) { this.add('DELETE', p, ...h); }

  resolver(metodo, ruta) {
    const segmentos = ruta.split('/').filter(Boolean);
    externo:
    for (const r of this.rutas) {
      if (r.metodo !== metodo || r.partes.length !== segmentos.length) continue;
      const params = {};
      for (let i = 0; i < segmentos.length; i++) {
        const p = r.partes[i];
        if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(segmentos[i]);
        else if (p !== segmentos[i]) continue externo;
      }
      return { ruta: r, params };
    }
    return null;
  }
}

export function leerCuerpo(req) {
  return new Promise((resolver, rechazar) => {
    let datos = '';
    req.on('data', (trozo) => {
      datos += trozo;
      if (datos.length > 1_000_000) {
        rechazar(new HttpError(413, 'Cuerpo de la petición demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!datos.trim()) return resolver({});
      try {
        resolver(JSON.parse(datos));
      } catch {
        rechazar(new HttpError(400, 'JSON inválido en el cuerpo de la petición'));
      }
    });
    req.on('error', () => rechazar(new HttpError(400, 'Error al leer la petición')));
  });
}
