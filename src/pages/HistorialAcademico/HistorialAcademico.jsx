import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faBook,
  faChartLine,
  faArrowLeft,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

export default function HistorialAcademico() {

  const [registros, setRegistros] = useState([]);
  const [infoAlumno, setInfoAlumno] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {

    const fetchData = async () => {

      try {

        setLoading(true);

        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData?.user) {
          throw new Error("No hay sesión activa");
        }

        const correo = userData.user.email;

        const { data: alumnoInfo, error: errorAlumno } =
          await supabase
            .from("alumnos")
            .select("*")
            .eq("correo", correo)
            .single();

        if (errorAlumno) throw errorAlumno;

        setInfoAlumno(alumnoInfo);

        // Este historial es permanente: aunque el grupo/materia que lo
        // originó se elimine más adelante, el registro se conserva aquí.
        const { data: historial, error: errorHistorial } =
          await supabase
            .from("historial_academico")
            .select("*")
            .eq("id_alumno", alumnoInfo.id)
            .order("anio", { ascending: false })
            .order("periodo", { ascending: true })
            .order("materia", { ascending: true });

        if (errorHistorial) throw errorHistorial;

        setRegistros(historial || []);

      } catch (err) {

        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message
        });

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, []);

  const totalMaterias = registros.length;

  const calcularPromedio = () => {

    const finales = registros
      .map((r) => Number(r.calificacion_final))
      .filter((c) => !isNaN(c));

    if (finales.length === 0) return 0;

    const suma = finales.reduce((acc, val) => acc + val, 0);

    return (suma / finales.length).toFixed(1);

  };

  const obtenerEstado = (cal) => {
    if (cal >= 8) return "Aprobado";
    if (cal >= 6) return "Regular";
    return "Reprobado";
  };

  const obtenerColor = (cal) => {
    if (cal >= 8) return "bg-green-100 text-green-700";
    if (cal >= 6) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  if (loading) {

    return (
      <main className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-16 w-16 border-b-4 border-purple-700 rounded-full"></div>
      </main>
    );

  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100">

      <Navbar titulo="Historial Académico" />

      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-white border border-purple-200 text-purple-700 px-5 py-2 rounded-lg shadow hover:bg-purple-50 transition flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Regresar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border">

          <div className="flex items-center gap-4 mb-4">
            <FontAwesomeIcon icon={faGraduationCap} className="text-purple-600 text-3xl" />
            <div>
              <h2 className="text-2xl font-bold">
                {infoAlumno?.nombre} {infoAlumno?.apellido_paterno} {infoAlumno?.apellido_materno}
              </h2>
              <p className="text-gray-500">{infoAlumno?.correo}</p>
              <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                <FontAwesomeIcon icon={faClockRotateLeft} />
                Registro permanente: se conserva aunque el grupo o la materia ya no exista
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">

            <div className="bg-purple-50 p-5 rounded-xl text-center">
              <FontAwesomeIcon icon={faChartLine} className="text-purple-600 text-2xl mb-2" />
              <p className="text-gray-600">Promedio general</p>
              <p className="text-3xl font-bold text-purple-700">{calcularPromedio()}</p>
            </div>

            <div className="bg-green-50 p-5 rounded-xl text-center">
              <FontAwesomeIcon icon={faBook} className="text-green-600 text-2xl mb-2" />
              <p className="text-gray-600">Materias cursadas</p>
              <p className="text-3xl font-bold text-green-700">{totalMaterias}</p>
            </div>

            <div className="bg-blue-50 p-5 rounded-xl text-center">
              <p className="text-gray-600">Estado General</p>
              <p className="text-xl font-bold text-blue-700 mt-2">
                {calcularPromedio() >= 6 ? "Activo" : "En riesgo"}
              </p>
            </div>

          </div>

        </div>

        {totalMaterias === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center text-gray-500">
            Todavía no tienes materias registradas en tu historial académico.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-left">Materia</th>
                    <th className="py-3 px-4 text-center">Tipo</th>
                    <th className="py-3 px-4 text-left">Grupo</th>
                    <th className="py-3 px-4 text-left">Carrera</th>
                    <th className="py-3 px-4 text-left">Docente</th>
                    <th className="py-3 px-4 text-center">Periodo / Semestre</th>
                    <th className="py-3 px-4 text-center">Año</th>
                    <th className="py-3 px-4 text-center">Calificación final</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const cal = Number(r.calificacion_final);
                    return (
                      <tr key={r.id} className="border-b hover:bg-purple-50">
                        <td className="py-3 px-6 font-medium">{r.materia}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.tipo === "Bachillerato" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                            {r.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4">{r.grupo_nombre ?? "-"}</td>
                        <td className="py-3 px-4">{r.carrera_nombre ?? "-"}</td>
                        <td className="py-3 px-4">{r.docente_nombre ?? "-"}</td>
                        <td className="py-3 px-4 text-center">{r.tipo === "Bachillerato" ? (r.semestre ? `Semestre ${r.semestre}` : "-") : (r.periodo ?? "-")}</td>
                        <td className="py-3 px-4 text-center">{r.anio ?? "-"}</td>
                        <td className="py-3 px-4 text-center font-bold">
                          {!isNaN(cal) ? cal.toFixed(1) : "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!isNaN(cal) && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColor(cal)}`}>
                              {obtenerEstado(cal)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </main>
  );

}
