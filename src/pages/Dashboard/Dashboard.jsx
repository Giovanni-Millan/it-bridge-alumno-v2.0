import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faChartLine,
  faGraduationCap,
  faBullhorn,
  faBars,
  faTimes,
  faCalendarAlt,
  faLock,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { isSeguimientoEmocionalHabilitado } from "../../utils/featureFlags";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alumno, setAlumno] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorAvisos, setErrorAvisos] = useState(false);
  const [seguimientoHabilitado, setSeguimientoHabilitado] = useState(true);

  // Obtener sesión y datos del alumno
  const fetchUserSession = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      navigate("/");
      return;
    }

    const userId = sessionData.session.user.id;

    // Obtener datos del alumno desde tabla "alumnos"
    const { data: alumnoData, error: alumnoError } = await supabase
      .from("alumnos")
      .select("id, nombre, apellido_paterno, apellido_materno, correo, foto_url, acceso_bloqueado")
      .eq("id", userId)
      .single();

    if (alumnoError) {
      console.error("Error fetching alumno:", alumnoError);
      Swal.fire({
        icon: "error",
        title: "Error al cargar perfil",
        text: "No se pudo obtener tu información. Contacta al administrador.",
        confirmButtonColor: "#6b21a5",
      });
      setLoading(false);
      return;
    }

    // Mismo candado de negocio que en Login: si el admin bloqueó el acceso
    // (típicamente por falta de pago) mientras la sesión seguía abierta en
    // este navegador, se cierra aquí también en vez de dejar ver el resto
    // del portal.
    if (alumnoData?.acceso_bloqueado) {
      await supabase.auth.signOut();
      Swal.fire({
        icon: "warning",
        title: "Acceso bloqueado",
        text: "Tu acceso al Portal del Alumno está bloqueado por falta de pago. Realiza tu pago y contacta al administrador para reactivarlo.",
        confirmButtonColor: "#6b21a5",
      });
      navigate("/");
      return;
    }

    setAlumno(alumnoData);
    setLoading(false);
  };

  // Escuchar cambios en autenticación
  const listenAuthChanges = () => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/");
    });
    return data;
  };

  // Cerrar sesión con confirmación
  const handleLogOut = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas salir?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b21a5",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      await supabase.auth.signOut();
      navigate("/");
    }
  };

  // Obtener avisos desde Supabase
  const fetchAvisos = async () => {
    try {
      const { data, error } = await supabase
        .from("avisos")
        .select("id_aviso, titulo, descripcion, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar avisos:", error);
        setErrorAvisos(true);
        return;
      }

      setAvisos(data || []);
      setErrorAvisos(false);
    } catch (err) {
      console.error("Error inesperado:", err);
      setErrorAvisos(true);
    }
  };

  // Mostrar SweetAlert con los detalles del aviso al hacer clic
  const handleAvisoClick = (aviso) => {
    const fechaFormateada = aviso.created_at
      ? new Date(aviso.created_at).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Fecha no disponible";

    Swal.fire({
      title: aviso.titulo,
      html: `
        <div style="text-align: left;">
          <p><strong>Descripción:</strong></p>
          <p style="margin-bottom: 1rem;">${aviso.descripcion}</p>
          <p style="font-size: 0.9rem; color: #6b21a5;">
            <strong>Fecha:</strong> ${fechaFormateada}
          </p>
        </div>
      `,
      confirmButtonText: "Cerrar",
      confirmButtonColor: "#6b21a5",
      icon: "info",
      width: "500px",
    });
  };

  // Consultar si el psicólogo(a) habilitó el módulo de Seguimiento Emocional
  const fetchConfiguracion = async () => {
    const habilitado = await isSeguimientoEmocionalHabilitado();
    setSeguimientoHabilitado(habilitado);
  };

  useEffect(() => {
    fetchUserSession();
    fetchAvisos();
    fetchConfiguracion();
    const authListener = listenAuthChanges();

    // Escuchar en tiempo real si el psicólogo(a) cambia el interruptor
    const configChannel = supabase
      .channel("configuracion_sistema_alumno")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "configuracion_sistema" },
        (payload) => {
          setSeguimientoHabilitado(payload.new.seguimiento_emocional_habilitado);
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(configChannel);
    };
  }, []);

  // Construir nombre completo
  const nombreCompleto = alumno
    ? `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno || ""}`
    : "";

  // Función para obtener iniciales para avatar fallback
  const getInitials = () => {
    if (!alumno) return "A";
    return [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno]
      .filter(Boolean)
      .map((p) => p.trim()[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-700 border-opacity-50 mx-auto"></div>
          <p className="mt-4 text-purple-800 font-medium">Cargando portal del alumno...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Navbar superior */}
      <nav className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo / Título */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-3 text-purple-700 hover:text-purple-900"
              >
                <FontAwesomeIcon icon={faBars} size="lg" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
                Instituto Tecnológico Bridge
              </h1>
            </div>

            {/* Botón salir (visible en desktop y móvil) */}
            <button
              onClick={handleLogOut}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition duration-200"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              <span className="hidden sm:inline text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar (solo móvil overlay) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500">
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <div className="px-4 py-2">
              <div className="flex items-center space-x-3 mb-6">
                {alumno?.foto_url ? (
                  <img
                    src={alumno.foto_url}
                    alt="Perfil"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">
                    {getInitials()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800">{nombreCompleto}</p>
                  <p className="text-xs text-gray-500">{alumno?.correo}</p>
                </div>
              </div>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/ConsultarCalificaciones"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 text-gray-700"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <FontAwesomeIcon icon={faGraduationCap} className="text-purple-600" />
                    Calificaciones
                  </Link>
                </li>
                <li>
                  <Link
                    to="/HistorialAcademico"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 text-gray-700"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <FontAwesomeIcon icon={faClockRotateLeft} className="text-purple-600" />
                    Historial Académico
                  </Link>
                </li>
                <li>
                  {seguimientoHabilitado ? (
                    <Link
                      to="/RealizarSeguimientoEmocional"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 text-gray-700"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <FontAwesomeIcon icon={faChartLine} className="text-purple-600" />
                      Seguimiento Académico
                    </Link>
                  ) : (
                    <span
                      className="flex items-center gap-3 p-2 rounded-lg text-gray-400 cursor-not-allowed"
                      title="Deshabilitado temporalmente por tu psicólogo(a)"
                    >
                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                      Seguimiento Académico
                    </span>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de bienvenida */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            {alumno?.foto_url ? (
              <img
                src={alumno.foto_url}
                alt="Foto perfil"
                className="h-20 w-20 rounded-full object-cover border-4 border-purple-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-3xl font-bold">
                {getInitials()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Bienvenido, <span className="text-purple-700">{nombreCompleto}</span>
              </h2>
               <p className="text-gray-500 mt-1">{alumno?.correo}</p>
            </div>
          </div>
          {/* Badge de fecha */}
          <div className="mt-4 md:mt-0 text-sm bg-purple-50 px-3 py-1 rounded-full text-purple-700">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Tarjetas de acciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            to="/ConsultarCalificaciones"
            className="group bg-gradient-to-br from-purple-900 to-purple-700 hover:shadow-xl transition-all duration-300 rounded-2xl p-6 text-white flex flex-col items-center text-center transform hover:-translate-y-1"
          >
            <div className="bg-white/20 rounded-full p-4 mb-4 group-hover:scale-110 transition">
              <FontAwesomeIcon icon={faGraduationCap} className="text-4xl" />
            </div>
            <h3 className="text-xl font-bold mb-1">Calificaciones</h3>
            <p className="text-sm text-purple-100">Consulta tus calificaciones del ciclo actual</p>
          </Link>

          <Link
            to="/HistorialAcademico"
            className="group bg-gradient-to-br from-indigo-900 to-indigo-700 hover:shadow-xl transition-all duration-300 rounded-2xl p-6 text-white flex flex-col items-center text-center transform hover:-translate-y-1"
          >
            <div className="bg-white/20 rounded-full p-4 mb-4 group-hover:scale-110 transition">
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-4xl" />
            </div>
            <h3 className="text-xl font-bold mb-1">Historial Académico</h3>
            <p className="text-sm text-indigo-100">Tu registro permanente de todas las materias cursadas</p>
          </Link>

          {seguimientoHabilitado ? (
            <Link
              to="/RealizarSeguimientoEmocional"
              className="group bg-gradient-to-br from-purple-800 to-purple-600 hover:shadow-xl transition-all duration-300 rounded-2xl p-6 text-white flex flex-col items-center text-center transform hover:-translate-y-1"
            >
              <div className="bg-white/20 rounded-full p-4 mb-4 group-hover:scale-110 transition">
                <FontAwesomeIcon icon={faChartLine} className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-1">Seguimiento Académico</h3>
              <p className="text-sm text-purple-100">Monitorea tu progreso y bienestar</p>
            </Link>
          ) : (
            <div
              className="bg-gray-100 border border-dashed border-gray-300 rounded-2xl p-6 text-gray-400 flex flex-col items-center text-center cursor-not-allowed"
              title="Deshabilitado temporalmente por tu psicólogo(a)"
            >
              <div className="bg-gray-200 rounded-full p-4 mb-4">
                <FontAwesomeIcon icon={faLock} className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-1">Seguimiento Académico</h3>
              <p className="text-sm text-gray-400">No disponible temporalmente</p>
            </div>
          )}
        </div>

        {/* Sección de Avisos */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-purple-100 px-6 py-4 border-b border-purple-200 flex items-center gap-2">
            <FontAwesomeIcon icon={faBullhorn} className="text-purple-800" />
            <h2 className="text-xl font-semibold text-purple-900">Avisos importantes</h2>
          </div>

          <div className="p-6">
            {errorAvisos ? (
              <div className="text-center py-8 text-gray-500">
                <p>No se pudieron cargar los avisos. Intenta más tarde.</p>
              </div>
            ) : avisos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay avisos disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {avisos.map((aviso) => (
                  <div
                    key={aviso.id_aviso}
                    onClick={() => handleAvisoClick(aviso)}
                    className="border border-purple-100 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-purple-300 bg-white cursor-pointer"
                  >
                    <h3 className="font-bold text-lg text-purple-800 mb-2">
                      {aviso.titulo}
                    </h3>
                    {aviso.created_at && (
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {new Date(aviso.created_at).toLocaleDateString("es-ES")}
                      </p>
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {aviso.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

     {/*  Chat flotante n8n
      <div className="fixed bottom-6 right-6 z-50">
        Botón flotante 
        <input type="checkbox" id="chat-toggle" className="hidden peer" />

        <label
          htmlFor="chat-toggle"
          className="flex items-center justify-center w-14 h-14 bg-purple-700 hover:bg-purple-800 text-white rounded-full shadow-lg cursor-pointer transition-all"
        >
          💬
        </label>

         Ventana del chat
        <div className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden hidden peer-checked:block">
          <iframe
            src="http://187.208.118.113:5678/webhook/c7fe5767-56a5-4f88-878e-8a73486ac60f/chat"
            className="w-full h-full border-0"
          />
        </div>
      </div> */}

    </div>
  );
}