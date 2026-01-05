// client/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import api from "../utils/api";

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      enqueueSnackbar("Las contraseñas no coinciden", { variant: "error" });
      return;
    }

    if (formData.password.length < 8) {
      enqueueSnackbar("La contraseña debe tener al menos 8 caracteres", {
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        // rol: 'técnico' por defecto
      });
      enqueueSnackbar("Usuario creado. Ahora inicia sesión.", {
        variant: "success",
      });
      navigate("/login");
    } catch (error) {
      const msg = error.response?.data?.error || "Error al crear usuario";
      enqueueSnackbar(`${msg}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              name="nombre"
              type="text"
              placeholder="Nombre completo"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              name="password"
              type="password"
              placeholder="Contraseña (mín. 8 caracteres)"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded font-medium hover:bg-green-700 transition"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p className="text-center mt-4">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Inicia sesión
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
