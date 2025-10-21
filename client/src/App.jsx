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
    try {
      const res = await axios.get('http://localhost:5000/api/visitas');
      setVisitas(res.data);
    } catch (error) {
      console.error('Error al cargar visitas:', error);
    }
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
      console.error('Error al guardar:', error);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Visitas Técnicas SegurPro</h1>

        {/* Formulario */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={form.rutEmpresa}
              onChange={e => setForm({ ...form, rutEmpresa: e.target.value })}
              placeholder="RUT Empresa"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              value={form.nombreEmpresa}
              onChange={e => setForm({ ...form, nombreEmpresa: e.target.value })}
              placeholder="Nombre Empresa"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              value={form.comentario}
              onChange={e => setForm({ ...form, comentario: e.target.value })}
              placeholder="Comentario"
              required
              rows="3"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {[0,1,2,3,4].map(i => (
              <input
                key={i}
                type="email"
                value={form.emailsNotificacion[i] || ''}
                onChange={e => handleEmailChange(i, e.target.value)}
                placeholder={`Correo ${i + 1}`}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            ))}
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {editId ? 'Actualizar Visita' : 'Crear Visita'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => { setEditId(null); resetForm(); }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de visitas */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Visitas Registradas</h2>
          <div className="space-y-4">
            {visitas.length === 0 ? (
              <p className="text-gray-500">No hay visitas registradas.</p>
            ) : (
              visitas.map(v => (
                <div key={v._id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">{v.nombreEmpresa} <span className="text-sm text-gray-500">({v.rutEmpresa})</span></h3>
                  <p className="mt-2 text-gray-700">{v.comentario}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>Correos:</strong> {v.emailsNotificacion.join(', ')}
                  </p>
                  {v.fotos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {v.fotos.map((foto, i) => (
                        <img
                          key={i}
                          src={foto}
                          alt="Visita"
                          className="w-20 h-20 object-cover rounded border"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                          }}
                          />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => startEdit(v)}
                    className="mt-3 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                  >
                    Editar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
