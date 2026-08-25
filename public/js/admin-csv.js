// ── Import/Export CSV de productos (panel admin) ──
window.initAdminCSV = function () {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h3>Importar / Exportar productos (CSV)</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <a href="/api/admin/productos.csv" class="btn btn-outline dark" download style="text-decoration:none;padding:9px 18px;">⬇️ Exportar CSV</a>
      <label class="btn btn-outline dark" style="cursor:pointer;padding:9px 18px;margin:0;">
        ⬆️ Importar CSV
        <input type="file" accept=".csv" id="csv-file-input" style="display:none;">
      </label>
      <span id="csv-feedback" style="font-size:.85rem;font-weight:600;"></span>
    </div>
    <p style="margin:10px 0 0;font-size:.78rem;color:var(--tinta-suave);">
      Columnas: slug, nombre, tagline, precio, costo, stock. Los productos existentes se actualizan por slug.
    </p>`;

  const cont = $('#admin-productos');
  cont?.parentNode.insertBefore(panel, cont.nextSibling);

  panel.querySelector('#csv-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const feedback = panel.querySelector('#csv-feedback');
    try {
      const csv = await file.text();
      const r = await api('/admin/productos/importar', { method: 'POST', body: { csv } });
      feedback.style.color = 'var(--exito)';
      feedback.textContent = `✓ ${r.creados} creados · ${r.actualizados} actualizados`;
      cargarTablaProductos();
    } catch (err) {
      feedback.style.color = 'var(--error)';
      feedback.textContent = '✕ ' + err.message;
    }
  });
};
