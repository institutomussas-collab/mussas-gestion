import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Package, Plus } from 'lucide-react';

export default function Stock() {
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ item: '', talle: 'M', cantidad: 10, precio: 0 });

  useEffect(() => {
    cargarStock();
  }, []);

  const cargarStock = async () => {
    try {
      const q = await getDocs(collection(db, 'stock'));
      setProductos(q.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const guardarProd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'stock'), form);
      setModal(false);
      setForm({ item: '', talle: 'M', cantidad: 10, precio: 0 });
      cargarStock();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package color="#ff0055" /> Stock & Indumentaria Mussas
        </h2>
        <button onClick={() => setModal(true)} style={btnPrimary}><Plus size={18}/> Nuevo Producto</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181818', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ff0055', color: '#fff' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Item / Prenda</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Talle</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Stock Disponible</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Precio Venta ($)</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.item}</td>
              <td style={{ padding: '12px' }}>{p.talle}</td>
              <td style={{ padding: '12px', color: '#00e5ff', fontWeight: 'bold' }}>{p.cantidad} unidades</td>
              <td style={{ padding: '12px', color: '#ff0055', fontWeight: 'bold' }}>${p.precio.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#ff0055', marginTop: 0 }}>Cargar Producto</h3>
            <form onSubmit={guardarProd}>
              <input type="text" placeholder="Ej. Remera Mussas Negra" required style={inputStyle} value={form.item} onChange={e => setForm({...form, item: e.target.value})} />
              <input type="text" placeholder="Talle (ej. 1, 2, S, M, L)" required style={inputStyle} value={form.talle} onChange={e => setForm({...form, talle: e.target.value})} />
              <input type="number" placeholder="Cantidad Inicial" style={inputStyle} value={form.cantidad} onChange={e => setForm({...form, cantidad: Number(e.target.value)})} />
              <input type="number" placeholder="Precio ($)" style={inputStyle} value={form.precio} onChange={e => setForm({...form, precio: Number(e.target.value)})} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const inputStyle = { width: '100%', padding: '9px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#181818', padding: '25px', borderRadius: '10px', width: '400px', border: '1px solid #ff0055' };
const btnCancel = { backgroundColor: '#444', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' };