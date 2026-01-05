// client/src/hooks/useAuth.js
import { useState, useEffect } from "react";
import api from "../utils/api";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
        const { data } = await api.get("/auth/me");
        setUser(data.usuario);
      } catch (error) {
        console.warn("Sesión inválida, limpiando token");
        // Si el token es inválido, limpiarlo
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verificarSesion();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.usuario);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Error al cerrar sesión:");
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return { user, loading, login, logout };
};

export default useAuth;
