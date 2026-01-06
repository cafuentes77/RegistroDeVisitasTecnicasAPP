// client/src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SnackbarProvider, useSnackbar } from "notistack";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import api from "./utils/api";

// Componente protegido (debe estar FUERA de App)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Componente principal de la app (dashboard)
const Dashboard = () => {
  const { user, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [visitas, setVisitas] = useState([]);
  const [form, setForm] = useState({
    folio: "",
    folioEditado: false,
    rutEmpresa: "",
    nombreEmpresa: "",
    tipoVisita: "visita_tecnica",
    comentario: "",
    emailsNotificacion: [""],
    fotosSeleccionadas: [],
    fotosExistentes: [],
  });
  const [editId, setEditId] = useState(null);
  const [rutError, setRutError] = useState("");
  const [confirmacionId, setConfirmacionId] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // Función para formatear RUT
  const formatearRut = (rut) => {
    if (!rut) return "";
    let cleaned = rut.replace(/[^\dKk]/g, "").toUpperCase();
    if (cleaned.length <= 1) return cleaned;
    return (
      cleaned.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
      "-" +
      cleaned.slice(-1)
    );
  };

  // Validar RUT
  const validarRut = (rut) => {
    if (!rut) return false;
    rut = rut.replace(/[.-]/g, "");
    if (rut.length < 2) return false;
    const dv = rut.slice(-1).toUpperCase();
    const num = rut.slice(0, -1);
    if (!/^\d+$/.test(num)) return false;
    let suma = 0;
    let mul = 2;
    for (let i = num.length - 1; i >= 0; i--) {
      suma += parseInt(num.charAt(i)) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const dvCalculado = 11 - (suma % 11);
    const dvEsperado =
      dvCalculado === 11
        ? "0"
        : dvCalculado === 10
        ? "K"
        : dvCalculado.toString();
    return dv === dvEsperado;
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
    const classes = {
      visita_tecnica:
        "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full",
      visita_mantencion:
        "px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full",
      visita_emergencia:
        "px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full",
    };
    return (
      classes[tipo] ||
      "px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
    );
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

  const fetchVisitas = async () => {
    try {
      const res = await api.get("http://localhost:5000/api/visitas");
      setVisitas(res.data);
    } catch (error) {
      console.error("Error al obtener visitas:", error);
      enqueueSnackbar("Error al cargar visitas", { variant: "error" });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, fotosSeleccionadas: files }));
  };

  const resetForm = () => {
    setForm({
      folio: "",
      folioEditado: false,
      rutEmpresa: "",
      nombreEmpresa: "",
      tipoVisita: "visita_tecnica",
      comentario: "",
      emailsNotificacion: [""],
      fotosSeleccionadas: [],
    });
    setRutError("");
    setEditId(null);
  };

  const startEdit = (visita) => {
    setForm({
      folio: visita.folio || "",
      folioEditado: visita.folioEditado || false,
      rutEmpresa: visita.rutEmpresa || "",
      nombreEmpresa: visita.nombreEmpresa || "",
      tipoVisita: visita.tipoVisita || "visita_tecnica",
      comentario: visita.comentario || "",
      emailsNotificacion: Array.isArray(visita.emailsNotificacion)
        ? visita.emailsNotificacion.length > 0
          ? visita.emailsNotificacion
          : [""]
        : [""],
      fotosExistentes: Array.isArray(visita.fotos) ? visita.fotos : [],
      fotosSeleccionadas: [],
    });
    setEditId(visita._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirConfirmacion = (id) => {
    setConfirmacionId(id);
  };

  const eliminarVisita = async () => {
    try {
      await api.delete(`/visitas/${confirmacionId}`);
      enqueueSnackbar("Visita eliminada con éxito", { variant: "success" });
      fetchVisitas();
      setConfirmacionId(null);
    } catch (error) {
      console.error("Error al eliminar visita:", error);
      enqueueSnackbar(`${error.response?.data?.error || "Error al eliminar"}`, {
        variant: "error",
      });
    }
  };

  const cerrarVisita = async (id) => {
    try {
      await api.post(`/visitas/${id}/cerrar`);
      enqueueSnackbar("Visita cerrada con éxito", { variant: "success" });
      fetchVisitas();
    } catch (error) {
      console.error("Error al cerrar visita:", error);
      enqueueSnackbar(`${error.response?.data?.error || "Error al cerrar"}`, {
        variant: "error",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarRut(form.rutEmpresa)) {
      setRutError("RUT inválido");
      return;
    }

    const formData = new FormData();
    formData.append("rutEmpresa", form.rutEmpresa);
    formData.append("nombreEmpresa", form.nombreEmpresa);
    formData.append("tipoVisita", form.tipoVisita);
    formData.append("comentario", form.comentario);
    formData.append("folios", form.folio || "");
    formData.append("folioEditado", form.folioEditado);

    const emailsValidos = form.emailsNotificacion.filter(
      (email) => email.trim() !== ""
    );
    if (emailsValidos.length > 5) {
      enqueueSnackbar("❌ No puedes añadir más de 5 correos", {
        variant: "error",
      });
      return;
    }
    formData.append("emailsNotificacion", JSON.stringify(emailsValidos));

    if (form.fotosSeleccionadas.length > 0) {
      form.fotosSeleccionadas.forEach((file) => {
        formData.append("fotos", file);
      });
    }

    try {
      if (editId) {
        await api.put(`/visitas/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        enqueueSnackbar("Visita actualizada con éxito", {
          variant: "warning",
        });
        setEditId(null);
      } else {
        await api.post("visitas", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        enqueueSnackbar("Visita creada con éxito", { variant: "success" });
      }

      fetchVisitas();
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error al guardar visita:", error);
      const mensaje =
        error.response?.data?.error ||
        "No se pudo guardar la visita. Verifica los datos o los archivos subidos.";
      enqueueSnackbar(`${mensaje}`, { variant: "error" });
    }
  };

  useEffect(() => {
    if (user) {
      fetchVisitas();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo + Título */}
          <div className="flex items-center space-x-6">
            <img
              src="/segurpro.jpg" // 👈 Ruta a tu logo
              alt="Logo de la empresa"
              className="h-10 w-auto" // Ajusta la altura aquí (h-10 = 2.5rem ≈ 40px)
            />
            <h1 className="text-xl font-bold text-gray-800">
              Gestión de Visitas Técnicas
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Hola, {user?.nombre} (
              {user?.rol === "administrador" ? "Admin" : "Técnico"})
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT Empresa
              </label>
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
                placeholder="50.345.678-9"
                className={`w-full p-2 border rounded ${
                  rutError ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {rutError && (
                <p className="text-red-500 text-sm mt-1">{rutError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Empresa
              </label>
              <input
                value={form.nombreEmpresa}
                onChange={(e) =>
                  setForm({ ...form, nombreEmpresa: e.target.value })
                }
                placeholder="Nombre de la empresa"
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Visita
              </label>
              <select
                value={form.tipoVisita}
                onChange={(e) =>
                  setForm({ ...form, tipoVisita: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="visita_tecnica">Visita técnica</option>
                <option value="visita_mantencion">Visita de mantención</option>
                <option value="visita_emergencia">Visita de emergencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correos de Notificación
              </label>
              {(form.emailsNotificacion.length > 0
                ? form.emailsNotificacion
                : [""]
              ).map((email, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...form.emailsNotificacion];
                      newEmails[index] = e.target.value;
                      setForm({ ...form, emailsNotificacion: newEmails });
                    }}
                    placeholder="correo@ejemplo.com"
                    className="w-full p-2 border border-gray-300 rounded"
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
                      className="px-3 bg-red-500 text-white rounded"
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (form.emailsNotificacion.length >= 5) {
                    enqueueSnackbar("Máximo 5 correos permitidos", {
                      variant: "warning",
                    });
                    return;
                  }
                  setForm({
                    ...form,
                    emailsNotificacion: [...form.emailsNotificacion, ""],
                  });
                }}
                disabled={form.emailsNotificacion.length >= 5}
                className="text-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Agregar correo ({form.emailsNotificacion.length}/5)
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario
            </label>
            <textarea
              value={form.comentario}
              onChange={(e) => setForm({ ...form, comentario: e.target.value })}
              placeholder="Descripción de la visita"
              className="w-full p-2 border border-gray-300 rounded"
              rows="3"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fotos (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const newFiles = Array.from(e.target.files);
                setForm((prev) => {
                  const updated = [...prev.fotosSeleccionadas, ...newFiles];
                  if (updated.length > 10) {
                    // Opcional: mostrar mensaje
                    alert("Máximo 10 fotos permitidas");
                    return {
                      ...prev,
                      fotosSeleccionadas: updated.slice(0, 10),
                    };
                  }
                  return { ...prev, fotosSeleccionadas: updated };
                });
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />

            {/* Vista previa: fotos existentes + nuevas */}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Fotos ya guardadas (URLs del backend) */}
              {(form.fotosExistentes || []).map((url, index) => (
                <div key={`existente-${index}`} className="relative">
                  <img
                    src={url}
                    alt="Foto existente"
                    className="w-20 h-20 object-cover rounded border"
                    onError={(e) => {
                      e.target.src =
                        "image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmMmYyZjIiLz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIxMiIgZmlsbD0iI2Q4ZDhkOCIvPgogIDxwYXRoIGQ9Ik0zNSAzNSBMNDUgNDUgTTQ1IDM1IEwzNSA0NSIgc3Ryb2tlPSIjYmNiY2JjIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI0MCIgeT0iNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzg4ODg4OCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2luIGltYWdlPC90ZXh0Pgo8L3N2Zz4=";
                    }}
                  />
                  {/* No se puede eliminar foto existente desde aquí (solo al reemplazar con nuevas) */}
                </div>
              ))}

              {/* Nuevas fotos seleccionadas (archivos locales) */}
              {form.fotosSeleccionadas.map((file, index) => (
                <div key={`nueva-${index}`} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Nueva foto"
                    className="w-20 h-20 object-cover rounded border"
                    onLoad={() =>
                      URL.revokeObjectURL(URL.createObjectURL(file))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        fotosSeleccionadas: prev.fotosSeleccionadas.filter(
                          (_, i) => i !== index
                        ),
                      }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {editId ? "Actualizar Visita" : "Crear Visita"}
          </button>
        </form>

        <input
          type="text"
          placeholder="Buscar por folio, empresa, RUT, tipo o fecha..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-6 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="space-y-4">
          {visitas
            .filter((visita) => {
              const termino = busqueda.toLowerCase().trim();
              if (!termino) return true;

              const coincideFolio = visita.folio
                ?.toLowerCase()
                .includes(termino);
              const coincideNombre = visita.nombreEmpresa
                ?.toLowerCase()
                .includes(termino);
              const rutLimpio = (visita.rutEmpresa || "").replace(/[.-]/g, "");
              const coincideRut = rutLimpio.includes(
                termino.replace(/[.-]/g, "")
              );
              const tipoTexto =
                {
                  visita_tecnica: "visita técnica",
                  visita_mantencion: "visita mantención",
                  visita_emergencia: "visita emergencia",
                }[visita.tipoVisita] || "";
              const coincideTipo = tipoTexto.includes(termino);
              const fechaCreada = formatearFechaParaBusqueda(visita.createdAt);
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
            .map((v) => {
              const emails = Array.isArray(v.emailsNotificacion)
                ? v.emailsNotificacion
                : [];
              const fotos = Array.isArray(v.fotos) ? v.fotos : [];

              return (
                <div
                  key={v._id}
                  className="bg-white p-4 rounded-lg shadow border border-gray-200"
                >
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Folio:</strong> {v.folio}
                    {v.folioEditado && (
                      <span className="ml-2 text-xs text-blue-600">
                        (editado)
                      </span>
                    )}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {v.nombreEmpresa}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>RUT:</strong> {formatearRut(v.rutEmpresa)}
                  </p>
                  <span className={getTipoVisitaBadgeClass(v.tipoVisita)}>
                    {getTipoVisitaLabel(v.tipoVisita)}
                  </span>
                  <p className="mt-2 text-gray-700">{v.comentario}</p>
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
                  {fotos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {fotos.map((foto, i) => (
                        <img
                          key={i}
                          src={foto}
                          alt="Visita"
                          className="w-20 h-20 object-cover rounded border"
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmMmYyZjIiLz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIxMiIgZmlsbD0iI2Q4ZDhkOCIvPgogIDxwYXRoIGQ9Ik0zNSAzNSBMNDUgNDUgTTQ1IDM1IEwzNSA0NSIgc3Ryb2tlPSIjYmNiY2JjIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI0MCIgeT0iNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzg4ODg4OCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2luIGltYWdlPC90ZXh0Pgo8L3N2Zz4=";
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* ✅ Botones con roles */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => startEdit(v)}
                      className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                    >
                      Editar
                    </button>
                    {user && user.rol === "administrador" && (
                      <button
                        onClick={() => abrirConfirmacion(v._id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                      >
                        Eliminar
                      </button>
                    )}
                    {user && user.rol === "administrador" && !v.resuelta && (
                      <button
                        onClick={() => cerrarVisita(v._id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                      >
                        Cerrar visita
                      </button>
                    )}
                  </div>

                  {v.resuelta && (
                    <div className="mt-3 text-sm text-green-700 font-medium">
                      ✅ Visita resuelta
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {confirmacionId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <p>¿Estás seguro de que deseas eliminar esta visita?</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setConfirmacionId(null)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarVisita}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Componente raíz de rutas
const App = () => {
  return (
    <SnackbarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
};

export default App;
