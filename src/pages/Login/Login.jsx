import React, { useState, useEffect } from "react";
import logo from "./../../assets/logo.png";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { Eye, EyeOff, LogIn, Key, Mail, GraduationCap } from "lucide-react";
import { mostrarError } from "../../utils/errorTraductor";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setCorreo(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contrasena,
      });

      if (error) {
        mostrarError(error, "iniciar sesión");
        return;
      }

      if (data.user?.app_metadata?.rol !== "alumno") {
        await supabase.auth.signOut();
        Swal.fire({
          icon: "error",
          title: "Sin acceso",
          text: "Esta cuenta no tiene permiso para acceder al Portal del Alumno.",
          confirmButtonColor: "#6b21a5",
        });
        return;
      }

      // Candado de negocio (no es un baneo de Auth): el admin puede marcar
      // `alumnos.acceso_bloqueado` desde "Bloqueo de Acceso" — típicamente
      // por falta de pago. Las credenciales son correctas, pero no se le
      // deja entrar y se le explica por qué.
      const { data: alumnoData } = await supabase
        .from("alumnos")
        .select("acceso_bloqueado")
        .eq("id", data.user.id)
        .single();

      if (alumnoData?.acceso_bloqueado) {
        await supabase.auth.signOut();
        Swal.fire({
          icon: "warning",
          title: "Acceso bloqueado",
          text: "Tu acceso al Portal del Alumno está bloqueado por falta de pago. Realiza tu pago y contacta al administrador para reactivarlo.",
          confirmButtonColor: "#6b21a5",
        });
        return;
      }

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", correo.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      Swal.fire({
        title: "¡Bienvenido!",
        text: "Acceso concedido al portal del alumno",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      window.location.replace("/Dashboard");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Ocurrió un error inesperado.",
        confirmButtonColor: "#6b21a5",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!correo.trim()) {
      Swal.fire({
        icon: "info",
        title: "Correo requerido",
        text: "Ingresa tu correo electrónico para restablecer la contraseña.",
        confirmButtonColor: "#6b21a5",
      });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      mostrarError(error, "recuperar tu contraseña");
    } else {
      Swal.fire({
        icon: "success",
        title: "Correo enviado",
        text: "Revisa tu bandeja de entrada.",
        confirmButtonColor: "#6b21a5",
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-purple-950 to-purple-700 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 transition-all">
          {/* Logo con fondo blanco */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-full p-3 shadow-md">
              <img src={logo} alt="Logo Escolar" className="h-16 w-auto md:h-20" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-center bg-gradient-to-r from-purple-900 to-purple-700 bg-clip-text text-transparent">
            Portal del Alumno
          </h1>
          <p className="text-purple-600 text-center text-sm mt-1 mb-6">
            Accede a tus recursos escolares
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Correo */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-purple-800 ml-1">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  placeholder="tunombre@itbridge.edu.mx"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-purple-800 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-500 hover:text-purple-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Recordar y Olvidé */}
            

            {/* Botón de ingreso */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 py-1 rounded-full text-purple-500">
                  Sistema escolar seguro
                </span>
              </div>
            </div>
            <p className="text-xs text-purple-400 mt-4 flex items-center justify-center gap-1">
              <GraduationCap size={14} />
              Acceso exclusivo para alumnos con correo institucional
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </main>
  );
}