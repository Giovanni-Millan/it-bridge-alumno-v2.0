import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { isSeguimientoEmocionalHabilitado } from "../../utils/featureFlags";
import { mostrarError } from "../../utils/errorTraductor";

// Lista de preguntas (texto exacto del test)
const preguntas = [
  "Presto mucha atención a los sentimientos.",
  "Normalmente me preocupo mucho por lo que siento.",
  "Normalmente dedico tiempo a pensar en mis emociones.",
  "Pienso que merece la pena prestar atención a mis emociones y estado de ánimo.",
  "Dejo que mis sentimientos afecten a mis pensamientos.",
  "Pienso en mi estado de ánimo constantemente.",
  "A menudo pienso en mis sentimientos.",
  "Presto mucha atención a cómo me siento.",
  "Tengo claros mis sentimientos.",
  "Frecuentemente puedo definir mis sentimientos.",
  "Casi siempre sé cómo me siento.",
  "Normalmente conozco mis sentimientos sobre las personas.",
  "A menudo me doy cuenta de mis sentimientos en diferentes situaciones.",
  "Siempre puedo decir cómo me siento.",
  "A veces puedo decir cuáles son mis emociones.",
  "Puedo llegar a comprender mis sentimientos.",
  "Aunque a veces me siento triste, suelo tener una visión optimista.",
  "Aunque me sienta mal, procuro pensar en cosas agradables.",
  "Cuando estoy triste, pienso en todos los placeres de la vida.",
  "Intento tener pensamientos positivos aunque me sienta mal.",
  "Si doy demasiadas vueltas a las cosas, complicándolas, trato de calmarme.",
  "Me preocupo por tener un buen estado de ánimo.",
  "Tengo mucha energía cuando me siento feliz.",
  "Cuando estoy enfadado intento cambiar mi estado de ánimo.",
];

// Opciones de respuesta (valor numérico y etiqueta)
const opciones = [
  { valor: 1, label: "Nada de acuerdo" },
  { valor: 2, label: "Algo de acuerdo" },
  { valor: 3, label: "Bastante de acuerdo" },
  { valor: 4, label: "Muy de acuerdo" },
  { valor: 5, label: "Totalmente de acuerdo" },
];

export default function RealizarSeguimientoEmocional() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);

  // Estado dinámico para las 24 preguntas
  const [respuestas, setRespuestas] = useState(() =>
    Array(preguntas.length).fill("")
  );

  // Calcular progreso
  const answeredCount = respuestas.filter((r) => r !== "").length;
  const allAnswered = answeredCount === preguntas.length;

  // Obtener sesión
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log(error.message);
        return;
      }
      if (!data.session) {
        Swal.fire({
          icon: "warning",
          title: "Sesión no encontrada",
          text: "Debes iniciar sesión para continuar.",
          confirmButtonColor: "#6b21a8",
        }).then(() => navigate("/Login"));
        return;
      }

      // Bloquear acceso directo por URL si el psicólogo(a) deshabilitó el módulo
      const habilitado = await isSeguimientoEmocionalHabilitado();
      if (!habilitado) {
        Swal.fire({
          icon: "info",
          title: "No disponible",
          text: "El seguimiento emocional está deshabilitado temporalmente por tu psicólogo(a).",
          confirmButtonColor: "#6b21a8",
        }).then(() => navigate("/dashboard"));
        return;
      }

      setUserEmail(data.session.user.email);
      setUserId(data.session.user.id);
    };
    checkSession();
  }, [navigate]);

  // Manejar cambio de respuesta
  const handleRespuestaChange = (index, valor) => {
    const nuevas = [...respuestas];
    nuevas[index] = valor;
    setRespuestas(nuevas);
  };

  // Envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!allAnswered) {
      Swal.fire({
        icon: "warning",
        title: "Preguntas incompletas",
        text: "Debes responder todas las preguntas antes de enviar.",
        confirmButtonColor: "#6b21a8",
      });
      return;
    }

    if (!userId) {
      Swal.fire({
        icon: "error",
        title: "Error de sesión",
        text: "No se pudo identificar al alumno. Intenta recargar la página.",
        confirmButtonColor: "#6b21a8",
      });
      return;
    }

    // Convertir respuestas a números (ya lo son por los valores, pero por seguridad)
    const respuestasNumericas = respuestas.map(Number);

    // Construir objeto de inserción dinámicamente
    const insertData = {
      id_alumno: userId,
      reactivo_1: respuestasNumericas[0],
      reactivo_2: respuestasNumericas[1],
      reactivo_3: respuestasNumericas[2],
      reactivo_4: respuestasNumericas[3],
      reactivo_5: respuestasNumericas[4],
      reactivo_6: respuestasNumericas[5],
      reactivo_7: respuestasNumericas[6],
      reactivo_8: respuestasNumericas[7],
      reactivo_9: respuestasNumericas[8],
      reactivo_10: respuestasNumericas[9],
      reactivo_11: respuestasNumericas[10],
      reactivo_12: respuestasNumericas[11],
      reactivo_13: respuestasNumericas[12],
      reactivo_14: respuestasNumericas[13],
      reactivo_15: respuestasNumericas[14],
      reactivo_16: respuestasNumericas[15],
      reactivo_17: respuestasNumericas[16],
      reactivo_18: respuestasNumericas[17],
      reactivo_19: respuestasNumericas[18],
      reactivo_20: respuestasNumericas[19],
      reactivo_21: respuestasNumericas[20],
      reactivo_22: respuestasNumericas[21],
      reactivo_23: respuestasNumericas[22],
      reactivo_24: respuestasNumericas[23],
    };

    const { error } = await supabase
      .from("seguimiento_academico")
      .insert([insertData]);

    if (error) {
      mostrarError(error, "guardar tu seguimiento emocional");
      return;
    }

    Swal.fire({
      icon: "success",
      title: "¡Guardado correctamente!",
      text: "El seguimiento emocional se registró correctamente.",
      confirmButtonColor: "#6b21a8",
    }).then(() => {
      navigate("/Dashboard");
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar titulo="Seguimiento Emocional" />

      {/* Botón volver */}
      <div className="mt-6 ml-4 md:ml-16">
        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-5 py-2 rounded-full hover:bg-purple-200 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Volver al dashboard
        </Link>
      </div>

      {/* Información de sesión y progreso */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 mx-4 md:mx-16 gap-3">
        <div className="bg-purple-100 text-purple-800 px-5 py-2 rounded-full text-sm">
          Sesión activa: <strong>{userEmail || "Cargando..."}</strong>
        </div>
        <div className="bg-white shadow-sm rounded-full px-5 py-2 text-sm font-medium">
          📋 Progreso: {answeredCount} de {preguntas.length} preguntas
        </div>
      </div>

      {/* Barra de progreso visual */}
      <div className="w-full bg-gray-200 h-2 rounded-full mt-4 mx-auto max-w-5xl">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(answeredCount / preguntas.length) * 100}%` }}
        ></div>
      </div>

      {/* Formulario */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {preguntas.map((texto, idx) => (
            <fieldset
              key={idx}
              className={`bg-white rounded-xl shadow-md p-5 transition ${
                respuestas[idx] ? "border-l-8 border-purple-500" : "border-l-8 border-transparent"
              }`}
            >
              <legend className="font-semibold text-gray-800 text-lg mb-4">
                {idx + 1}. {texto}
              </legend>

              <div className="flex flex-wrap gap-3 justify-start items-center">
                {opciones.map((op) => {
                  const idUnico = `q${idx}_${op.valor}`;
                  const isChecked = respuestas[idx] === op.valor.toString();
                  return (
                    <label
                      key={op.valor}
                      htmlFor={idUnico}
                      className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isChecked
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-purple-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`pregunta_${idx}`}
                        id={idUnico}
                        value={op.valor}
                        checked={isChecked}
                        onChange={() => handleRespuestaChange(idx, op.valor.toString())}
                        className="sr-only" // Oculta el radio nativo pero mantiene funcionalidad
                      />
                      {op.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {/* Botón enviar */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={!allAnswered}
              className={`px-10 py-3 rounded-lg text-white font-semibold text-lg transition ${
                allAnswered
                  ? "bg-purple-700 hover:bg-purple-900 shadow-lg cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {allAnswered ? "Enviar respuestas" : `Faltan ${preguntas.length - answeredCount} preguntas`}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}