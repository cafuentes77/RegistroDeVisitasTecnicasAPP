// client/src/App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { validarRut } from "./utils/validarRut.js";
import { useSnackbar } from "notistack";

// En App.jsx, función auxiliar
const formatearRut = (rut) => {
  if (!rut) return "";
  let rutLimpio = rut.replace(/[.-]/g, "");
  let cuerpo = rutLimpio.slice(0, -1);
  let dv = rutLimpio.slice(-1).toUpperCase();
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${dv}`;
};

//Hooks
const App = () => {
  const isProduction = import.meta.env.VITE_NODE_ENV === "production";

  const { enqueueSnackbar } = useSnackbar();
  const [visitas, setVisitas] = useState([]);
  const [form, setForm] = useState({
    folio: "",
    folioEditado: false,
    rutEmpresa: "",
    nombreEmpresa: "",
    tipoVisita: "visita_tecnica", // valor por defecto
    comentario: "",
    emailsNotificacion: [""],
    fotos: [],
    fotosPreview: [],
    fotosExistentes: [],
  });
  const [editId, setEditId] = useState(null);
  const [rutError, setRutError] = useState("");
  const [visitaAEliminar, setVisitaAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchVisitas();
  }, []);

  useEffect(() => {
    // Limpia las URLs de previsualización al desmontar el componente
    return () => {
      form.fotosPreview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.fotosPreview]);

  //Funciones
  const fetchVisitas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/visitas");
      setVisitas(res.data);
      const visitasOrdenadas = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setVisitas(visitasOrdenadas);
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
    const newFiles = Array.from(e.target.files);

    // Generar URLs de previsualización para las NUEVAS fotos
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setForm((prev) => {
      // Combina las fotos existentes con las nuevas
      const todasLasFotos = [...prev.fotos, ...newFiles];
      const todasLasPreviews = [...prev.fotosPreview, ...newPreviews];

      // Opcional: limitar a 10 fotos
      const limite = 10;
      return {
        ...prev,
        fotos: todasLasFotos.slice(0, limite),
        fotosPreview: todasLasPreviews.slice(0, limite),
      };
    });

    // Limpia el input para que pueda volver a seleccionar los mismos archivos
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarRut(form.rutEmpresa)) {
      setRutError("RUT inválido");
      return;
    }
    const formData = new FormData();
    formData.append("folio", form.folio);
    formData.append("rutEmpresa", form.rutEmpresa);
    formData.append("nombreEmpresa", form.nombreEmpresa);
    formData.append("tipoVisita", form.tipoVisita);
    formData.append("comentario", form.comentario);
    formData.append(
      "emailsNotificacion",
      JSON.stringify(
        form.emailsNotificacion.filter((email) => email.trim() !== "")
      )
    );

    form.fotos.forEach((file) => {
      formData.append("fotos", file);
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
        enqueueSnackbar("Visita actualizada con éxito", {
          variant: "warning",
        }); // ← aquí
        setEditId(null);
      } else {
        await axios.post("http://localhost:5000/api/visitas", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        enqueueSnackbar("Visita creada con éxito", { variant: "success" });
      }
      fetchVisitas();
      resetForm();

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      // Manejo de errores del backend (incluyendo validación de archivos)
      const mensaje =
        error.response?.data?.error ||
        "No se pudo guardar la visita. Verifica los datos o los archivos subidos.";
      enqueueSnackbar(`${mensaje}`, { variant: "error" });
      console.error("Error al guardar la visita:", error);
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
    setRutError("");
  };

  const startEdit = (visita) => {
    setForm({
      folio: visita.folio || "",
      folioEditado: visita.folioEditado || false,
      rutEmpresa: visita.rutEmpresa || "",
      nombreEmpresa: visita.nombreEmpresa || "",
      tipoVisita: visita.tipoVisita || "visita_tecnica", // ← ¡Importante!
      comentario: visita.comentario || "",
      emailsNotificacion: Array.isArray(visita.emailsNotificacion)
        ? [...visita.emailsNotificacion]
        : [""],
      fotos: [],
      fotosPreview: [],
      fotosExistentes: visita.fotos || [],
    });
    setEditId(visita._id);
    setRutError("");
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const abrirConfirmacion = (id) => {
    setVisitaAEliminar(id);
  };

  const eliminarVisita = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/visitas/${visitaAEliminar}`
      );
      enqueueSnackbar("Visita eliminada con éxito", { variant: "error" });
      fetchVisitas(); // Actualiza la lista
      setVisitaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
      enqueueSnackbar("Error al eliminar la visita", { variant: "error" });
      setVisitaAEliminar(null);
    }
  };

  const cerrarVisita = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/visitas/${id}/cerrar`);
      enqueueSnackbar("Visita cerrada con éxito", { variant: "success" });
      fetchVisitas(); // Actualiza la lista
    } catch (error) {
      const msg = error.response?.data?.error || "Error al cerrar la visita";
      enqueueSnackbar(`${msg}`, { variant: "error" });
    }
  };

  const getTipoVisitaLabel = (tipo) => {
    const labels = {
      visita_tecnica: "Visita técnica",
      visita_mantencion: "Visita de mantención",
      visita_emergencia: "Visita de emergencia",
    };
    return labels[tipo] || tipo;
  };

  const getTipoVisitaBadgeClass = (tipo) => {
    switch (tipo) {
      case "visita_emergencia":
        return "inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded";
      case "visita_mantencion":
        return "inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded";
      default:
        return "inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded";
    }
  };

  const formatearFechaParaBusqueda = (fecha) => {
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div>
          <img
            src="../public/segurpro.jpg"
            alt="Logo"
            className="h-20 w-auto object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Gestión de Visitas Técnicas SegurPro
        </h1>

        {/* Formulario */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Folio */}
            <input
              value={form.folio}
              onChange={(e) => setForm({ ...form, folio: e.target.value })}
              placeholder="Folio"
              readOnly={editId && isProduction && form.folioEditado}
              className={`w-full p-2 border rounded ${
                editId && isProduction && form.folioEditado
                  ? "bg-gray-100"
                  : "border-gray-300"
              }`}
            />
            {/* Campo RUT */}
            <div>
              <input
                value={form.rutEmpresa}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({ ...form, rutEmpresa: value });
                  if (value && !validarRut(value)) {
                    setRutError("RUT inválido");
                  } else {
                    setRutError("");
                  }
                }}
                placeholder="RUT Empresa (ej: 50.345.678-9)"
                required
                className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${
                  rutError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {rutError && (
                <p className="text-red-500 text-sm mt-1">{rutError}</p>
              )}
            </div>

            <input
              value={form.nombreEmpresa}
              onChange={(e) =>
                setForm({ ...form, nombreEmpresa: e.target.value })
              }
              placeholder="Nombre Empresa"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Selector de tipo de visita */}
            <select
              value={form.tipoVisita}
              onChange={(e) => setForm({ ...form, tipoVisita: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="visita_tecnica">Visita técnica</option>
              <option value="visita_mantencion">Visita de mantención</option>
              <option value="visita_emergencia">Visita de emergencia</option>
            </select>

            <textarea
              value={form.comentario}
              onChange={(e) => setForm({ ...form, comentario: e.target.value })}
              placeholder="Comentario"
              required
              rows="3"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Correos dinámicos */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Correos de notificación
              </label>

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
                        const newEmails = form.emailsNotificacion.filter(
                          (_, i) => i !== index
                        );
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
                      emailsNotificacion: [...form.emailsNotificacion, ""],
                    });
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  + Agregar correo
                </button>
              )}
            </div>
            {/* Fotos existentes (solo en edición) */}
            {editId && form.fotosExistentes.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Fotos existentes:</p>
                <div className="flex flex-wrap gap-2">
                  {form.fotosExistentes.map((foto, index) => (
                    <img
                      key={`existente-${index}`}
                      src={foto}
                      alt="Foto existente"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Nuevas fotos (previsualización) */}
            {form.fotosPreview?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Nuevas fotos:</p>
                <div className="flex flex-wrap gap-2">
                  {form.fotosPreview.map((preview, index) => (
                    <div key={`nueva-${index}`} className="relative">
                      <img
                        src={preview}
                        alt={`Nueva foto ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => {
                            const nuevasFotos = prev.fotos.filter(
                              (_, i) => i !== index
                            );
                            const nuevasPreviews = prev.fotosPreview.filter(
                              (_, i) => i !== index
                            );
                            return {
                              ...prev,
                              fotos: nuevasFotos,
                              fotosPreview: nuevasPreviews,
                            };
                          });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        aria-label="Eliminar foto"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input de archivos */}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {editId ? "Actualizar Visita" : "Crear Visita"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Input de búsqueda */}
        <input
          type="text"
          placeholder="Buscar por folio, empresa, RUT, tipo o fecha..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-6 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Lista de visitas */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Visitas Registradas
          </h2>
          <div className="space-y-4">
            {visitas.length === 0 ? (
              <p className="text-gray-500">No hay visitas registradas.</p>
            ) : (
              visitas
                .filter((visita) => {
                  const termino = busqueda.toLowerCase().trim();
                  if (!termino) return true; // Si no hay búsqueda, mostrar todo

                  // 1. Folio
                  const coincideFolio = visita.folio
                    ?.toLowerCase()
                    .includes(termino);

                  // 2. Nombre de empresa
                  const coincideNombre = visita.nombreEmpresa
                    ?.toLowerCase()
                    .includes(termino);

                  // 3. RUT (sin puntos ni guion, para búsqueda flexible)
                  const rutLimpio = (visita.rutEmpresa || "").replace(
                    /[.-]/g,
                    ""
                  );
                  const coincideRut = rutLimpio.includes(
                    termino.replace(/[.-]/g, "")
                  );

                  // 4. Tipo de visita (usamos el texto visible)
                  const tipoTexto =
                    {
                      visita_tecnica: "visita técnica",
                      visita_mantencion: "visita mantención",
                      visita_emergencia: "visita emergencia",
                    }[visita.tipoVisita] || "";
                  const coincideTipo = tipoTexto.includes(termino);

                  // 5. Fechas (createdAt y updatedAt)
                  const fechaCreada = formatearFechaParaBusqueda(
                    visita.createdAt
                  );
                  const fechaActualizada = formatearFechaParaBusqueda(
                    visita.updatedAt
                  );
                  const coincideFecha =
                    fechaCreada.includes(termino) ||
                    fechaActualizada.includes(termino);

                  return (
                    coincideFolio ||
                    coincideNombre ||
                    coincideRut ||
                    coincideTipo ||
                    coincideFecha
                  );
                })
                .map((v) => (
                  <div
                    key={v._id}
                    className="bg-white p-4 rounded-lg shadow border border-gray-200"
                  >
                    <p className="text-sm text-gray-600">
                      <strong>Folio:</strong> {v.folio}
                      {v.folioEditado && (
                        <span className="ml-2 text-xs text-blue-600">
                          (editado)
                        </span>
                      )}
                    </p>
                    <div className="flex justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {v.nombreEmpresa}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>RUT:</strong> {formatearRut(v.rutEmpresa)}
                        </p>
                        <span className={getTipoVisitaBadgeClass(v.tipoVisita)}>
                          {getTipoVisitaLabel(v.tipoVisita)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 space-y-1">
                      <strong>Comentarios:</strong> {v.comentario}
                    </p>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Creada:</strong>{" "}
                        {new Date(v.createdAt).toLocaleString("es-ES")}
                      </p>
                      {v.createdAt !== v.updatedAt && (
                        <p>
                          <strong>Actualizada:</strong>{" "}
                          {new Date(v.updatedAt).toLocaleString("es-ES")}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      <strong>Correos Notificados:</strong>{" "}
                      {v.emailsNotificacion.join(", ")}
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
                              e.target.src = e.target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmMmYyZjIiLz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIxMiIgZmlsbD0iI2Q4ZDhkOCIvPgogIDxwYXRoIGQ9Ik0zNSAzNSBMNDUgNDUgTTQ1IDM1IEwzNSA0NSIgc3Ryb2tlPSIjYmNiY2JjIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI0MCIgeT0iNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzg4ODg4OCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2luIGltYWdlPC90ZXh0Pgo8L3N2Zz4=";
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {!v.resuelta && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => startEdit(v)}
                          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => abrirConfirmacion(v._id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => cerrarVisita(v._id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                        >
                          Cerrar visita
                        </button>
                      </div>
                    )}

                    {/* Indicador de estado */}
                    <div className="mt-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          v.resuelta
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {v.resuelta ? "Resuelta" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
      {/* Diálogo de confirmación */}
      {visitaAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ¿Eliminar visita?
            </h3>
            <p className="text-gray-600 mb-6">
              Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar
              esta visita?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setVisitaAEliminar(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarVisita}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
