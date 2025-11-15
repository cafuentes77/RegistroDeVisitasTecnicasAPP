// client/src/App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { validarRut } from './utils/validarRut.js';
import { useSnackbar } from 'notistack';

  // En App.jsx, función auxiliar
const formatearRut = (rut) => {
  if (!rut) return '';
  let rutLimpio = rut.replace(/[.-]/g, '');
  let cuerpo = rutLimpio.slice(0, -1);
  let dv = rutLimpio.slice(-1).toUpperCase();
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${dv}`;
};

const App = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [visitas, setVisitas] = useState([]);
  const [form, setForm] = useState({
    rutEmpresa: "",
    nombreEmpresa: "",
    tipoVisita: "visita_técnica", // valor por defecto
    comentario: "",
    emailsNotificacion: [""],
    fotos: [],
  });
  const [editId, setEditId] = useState(null);
  const [rutError, setRutError] = useState('');

  useEffect(() => {
    fetchVisitas();
  }, []);

  const fetchVisitas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/visitas");
      setVisitas(res.data);
    } catch (error) {
      console.error("Error al cargar visitas:", error);
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
      if (!validarRut(form.rutEmpresa)) {
    setRutError('RUT inválido');
    return;
  }
    const formData = new FormData();
    formData.append('rutEmpresa', form.rutEmpresa);
    formData.append('nombreEmpresa', form.nombreEmpresa);
    formData.append('tipoVisita', form.tipoVisita);
    formData.append('comentario', form.comentario);
    formData.append('emailsNotificacion', JSON.stringify(form.emailsNotificacion.filter(email => email.trim() !== '')));

    form.fotos.forEach(file => {
      formData.append('fotos', file);
    });

    try {
      if (editId) {
        await axios.put(
          `http://localhost:5000/api/visitas/${editId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        enqueueSnackbar('🔄 Visita actualizada con éxito', { variant: 'warning' }); // ← aquí
        setEditId(null);
      } else {
        await axios.post("http://localhost:5000/api/visitas", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        enqueueSnackbar('✅ Visita creada con éxito', { variant: 'success' });
      }
      fetchVisitas();
      resetForm();
    } catch (error) {
      console.error("Error al guardar:", error);
      enqueueSnackbar('❌ Error al guardar la visita', { variant: 'error' });
    }
  };

  const resetForm = () => {
    setForm({
      rutEmpresa: "",
      nombreEmpresa: "",
      comentario: "",
      emailsNotificacion: [""],
      fotos: [],
    });
    setRutError('');
  };

  const startEdit = (visita) => {
    setForm({
      rutEmpresa: visita.rutEmpresa,
      nombreEmpresa: visita.nombreEmpresa,
      tipoVisita: visita.tipoVisita, // ← ¡Importante!
      comentario: visita.comentario,
      emailsNotificacion: Array.isArray(visita.emailsNotificacion)
      ?[...visita.emailsNotificacion]
      :[""],
      fotos: [],
    });
    setEditId(visita._id);
    setRutError('');

    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });}
    }, 100);
  };

const getTipoVisitaLabel = (tipo) => {
    const labels = {
      visita_técnica: 'Visita técnica',
      visita_mantención: 'Visita de mantención',
      visita_emergencia: 'Visita de emergencia'
    };
    return labels[tipo] || tipo;
  };

  const getTipoVisitaBadgeClass = (tipo) => {
    switch (tipo) {
      case 'visita_emergencia':
        return 'inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded';
      case 'visita_mantención':
        return 'inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded';
      default:
        return 'inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Visitas Técnicas SegurPro</h1>

        {/* Formulario */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo RUT */}
            <div>
              <input
                value={form.rutEmpresa}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({ ...form, rutEmpresa: value });
                  if (value && !validarRut(value)) {
                    setRutError('RUT inválido');
                  } else {
                    setRutError('');
                  }
                }}
                placeholder="RUT Empresa (ej: 50.345.678-9)"
                required
                className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${
                  rutError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {rutError && <p className="text-red-500 text-sm mt-1">{rutError}</p>}
            </div>

            <input
              value={form.nombreEmpresa}
              onChange={e => setForm({ ...form, nombreEmpresa: e.target.value })}
              placeholder="Nombre Empresa"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* Selector de tipo de visita */}
            <select
              value={form.tipoVisita}
              onChange={e => setForm({ ...form, tipoVisita: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="visita_técnica">Visita técnica</option>
              <option value="visita_mantención">Visita de mantención</option>
              <option value="visita_emergencia">Visita de emergencia</option>
            </select>

            <textarea
              value={form.comentario}
              onChange={e => setForm({ ...form, comentario: e.target.value })}
              placeholder="Comentario"
              required
              rows="3"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            
{/* Correos dinámicos */}
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">Correos de notificación</label>
  
  {form.emailsNotificacion.map((email, index) => (
    <div key={index} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          const newEmails = [...form.emailsNotificacion];
          newEmails[index] = e.target.value;
          setForm({ ...form, emailsNotificacion: newEmails });
        }}
        placeholder={`Correo ${index + 1}`}
        className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      />
      {form.emailsNotificacion.length > 1 && (
        <button
          type="button"
          onClick={() => {
            const newEmails = form.emailsNotificacion.filter((_, i) => i !== index);
            setForm({ ...form, emailsNotificacion: newEmails });
          }}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          –
        </button>
      )}
    </div>
  ))}

  {form.emailsNotificacion.length < 5 && (
    <button
      type="button"
      onClick={() => {
        setForm({
          ...form,
          emailsNotificacion: [...form.emailsNotificacion, '']
        });
      }}
      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
    >
      + Agregar correo
    </button>
  )}
</div>
            
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            <div className="flex gap-2 flex-wrap">
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
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {v.nombreEmpresa}{' '}
                        <span className="text-sm text-gray-500">
                          ({formatearRut(v.rutEmpresa)})
                        </span>
                      </h3>
                      <span className={getTipoVisitaBadgeClass(v.tipoVisita)}>
                        {getTipoVisitaLabel(v.tipoVisita)}
                      </span>
                    </div>
                  </div>

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
