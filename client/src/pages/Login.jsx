// client/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import useAuth from "../hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      enqueueSnackbar("¡Bienvenido!", { variant: "success" });
      // 🔁 Redirección forzada (solución definitiva)
      setTimeout(() => {
        window.location.href = "/";
      }, 500); // Redirigir al dashboard
    } catch (error) {
      const msg = error.response?.data?.error || "Error al iniciar sesión";
      enqueueSnackbar(`${msg}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-500 p-4">
      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
          <img
            src="/segurpro-removebg-preview.png"
            alt="SegurPro"
            className="h-16 w-auto sm:h-12" // Ajusta el tamaño según necesites
          />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Iniciando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
