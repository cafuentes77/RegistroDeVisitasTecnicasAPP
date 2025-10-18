// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [visitas, setVisitas] = useState([]);
  const [form, setForm] = useState({
    rutEmpresa: '',
    nombreEmpresa: '',
    comentario: '',
    emailsNotificacion: ['', '', '', '', ''],
    fotos: []
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchVisitas();
  }, []);

  const fetchVisitas = async () => {
    const res = await axios.get('http://localhost:5000/api/visitas');
    setVisitas(res.data);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...form.emailsNotificacion];
    newEmails[index] = value;
    setForm({ ...form, emailsNotificacion: newEmails });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, fotos: Array.from(e.target.files) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('rutEmpresa', form.rutEmpresa);
    formData.append('nombreEmpresa', form.nombreEmpresa);
    formData.append('comentario', form.comentario);
    formData.append('emailsNotificacion', JSON.stringify(form.emailsNotificacion.filter(email => email)));

    form.fotos.forEach(file => {
      formData.append('fotos', file);
    });

    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/visitas/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setEditId(null);
      } else {
        await axios.post('http://localhost:5000/api/visitas', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchVisitas();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setForm({
      rutEmpresa: '',
      nombreEmpresa: '',
      comentario: '',
      emailsNotificacion: ['', '', '', '', ''],
      fotos: []
    });
  };

  const startEdit = (visita) => {
    setForm({
      rutEmpresa: visita.rutEmpresa,
      nombreEmpresa: visita.nombreEmpresa,
      comentario: visita.comentario,
      emailsNotificacion: [...visita.emailsNotificacion, '', '', '', '', ''].slice(0, 5),
      fotos: []
    });
    setEditId(visita._id);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Gestión de Visitas</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={form.rutEmpresa}
          onChange={e => setForm({ ...form, rutEmpresa: e.target.value })}
          placeholder="RUT Empresa"
          required
        />
        <input
          value={form.nombreEmpresa}
          onChange={e => setForm({ ...form, nombreEmpresa: e.target.value })}
          placeholder="Nombre Empresa"
          required
        />
        <textarea
          value={form.comentario}
          onChange={e => setForm({ ...form, comentario: e.target.value })}
          placeholder="Comentario"
          required
        />
        {[0,1,2,3,4].map(i => (
          <input
            key={i}
            type="email"
            value={form.emailsNotificacion[i] || ''}
            onChange={e => handleEmailChange(i, e.target.value)}
            placeholder={`Correo ${i + 1}`}
          />
        ))}
        <input type="file" multiple onChange={handleFileChange} />
        <button type="submit">{editId ? 'Actualizar' : 'Crear Visita'}</button>
        {editId && <button type="button" onClick={() => { setEditId(null); resetForm(); }}>Cancelar</button>}
      </form>

      <h2>Visitas Registradas</h2>
      <ul>
        {visitas.map(v => (
          <li key={v._id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h3>{v.nombreEmpresa} ({v.rutEmpresa})</h3>
            <p>{v.comentario}</p>
            <p><strong>Correos:</strong> {v.emailsNotificacion.join(', ')}</p>
            <div>
              {v.fotos.map((foto, i) => (
                <img key={i} src={`http://localhost:5000${foto}`} alt="Visita" width="100" style={{ margin: '5px' }} />
              ))}
            </div>
            <button onClick={() => startEdit(v)}>Editar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
