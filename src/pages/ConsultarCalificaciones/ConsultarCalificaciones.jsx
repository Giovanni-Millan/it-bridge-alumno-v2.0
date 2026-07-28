import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faBook,
  faChartLine,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

export default function ConsultarCalificaciones() {

  const [universidad, setUniversidad] = useState([]);
  const [bachillerato, setBachillerato] = useState([]);
  const [infoAlumno, setInfoAlumno] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {

    const fetchData = async () => {

      try {

        setLoading(true);

        // 🔐 Usuario autenticado
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData?.user) {
          throw new Error("No hay sesión activa");
        }

        const correo = userData.user.email;

        // 📚 Obtener info del alumno
        const { data: alumnoInfo, error: errorAlumno } =
          await supabase
            .from("alumnos")
            .select("*")
            .eq("correo", correo)
            .single();

        if (errorAlumno) throw errorAlumno;

        setInfoAlumno(alumnoInfo);

        // 🧾 Calificaciones de Universidad (tabla "calificaciones")
        const { data: calificaciones, error: errorCal } =
          await supabase
            .from("calificaciones")
            .select(`
              id,
              materia,
              calificacion,
              periodo_cuatrimestre,
              ano_cuatrimestre,
              fecha_registro
            `)
            .eq("id_alumno", alumnoInfo.id)
            .order("materia", { ascending: true });

        if (errorCal) throw errorCal;

        // 🧾 Calificaciones de Bachillerato (tabla "calificaciones_parciales",
        // 3 parciales por materia en vez de una sola calificación final)
        const { data: parciales, error: errorParciales } =
          await supabase
            .from("calificaciones_parciales")
            .select(`
              id,
              materia,
              parcial,
              calificacion,
              registrado_en
            `)
            .eq("id_alumno", alumnoInfo.id)
            .order("materia", { ascending: true })
            .order("parcial", { ascending: true });

        if (errorParciales) throw errorParciales;

        // Una fila por materia con sus 3 parciales juntos (en vez de una
        // fila repetida por cada parcial), más el promedio de esa materia.
        const materiasBachillerato = {};
        (parciales || []).forEach((p) => {
          if (!materiasBachillerato[p.materia]) {
            materiasBachillerato[p.materia] = { materia: p.materia, parcial1: null, parcial2: null, parcial3: null };
          }
          materiasBachillerato[p.materia][`parcial${p.parcial}`] = p.calificacion;
        });

        const bachilleratoAgrupado = Object.values(materiasBachillerato).map((m) => {
          const capturados = [m.parcial1, m.parcial2, m.parcial3].filter((c) => c !== null).map(Number);
          const promedio = capturados.length
            ? capturados.reduce((acc, v) => acc + v, 0) / capturados.length
            : null;
          return { ...m, promedio };
        });

        setUniversidad(calificaciones || []);
        setBachillerato(bachilleratoAgrupado);

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

  // ================= PROMEDIO =================
  // Un valor final por materia (la calificación de universidad, o el
  // promedio de los parciales capturados en bachillerato), para que una
  // materia con 3 parciales no pese más que una con una sola calificación.

  const totalMaterias = universidad.length + bachillerato.length;

  const calcularPromedio = () => {

    const finalesPorMateria = [
      ...universidad.map((u) => Number(u.calificacion)),
      ...bachillerato.map((b) => b.promedio),
    ].filter((c) => c !== null && !isNaN(c));

    if (finalesPorMateria.length === 0) return 0;

    const suma = finalesPorMateria.reduce((acc, val) => acc + val, 0);

    return (suma / finalesPorMateria.length).toFixed(1);

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

      <Navbar titulo="Mis Calificaciones" />

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* BOTÓN REGRESAR */}

        <div className="mb-6">

          <button
            onClick={() => navigate(-1)}
            className="bg-white border border-purple-200 text-purple-700 px-5 py-2 rounded-lg shadow hover:bg-purple-50 transition flex items-center gap-2"
          >

            <FontAwesomeIcon icon={faArrowLeft} />

            Regresar

          </button>

        </div>

        {/* INFO ALUMNO */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border">

          <div className="flex items-center gap-4 mb-4">

            <FontAwesomeIcon
              icon={faGraduationCap}
              className="text-purple-600 text-3xl"
            />

            <div>

              <h2 className="text-2xl font-bold">
                {infoAlumno?.nombre}
                {" "}
                {infoAlumno?.apellido_paterno}
                {" "}
                {infoAlumno?.apellido_materno}
              </h2>

              <p className="text-gray-500">
                {infoAlumno?.correo}
              </p>

            </div>

          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">

            <div className="bg-purple-50 p-5 rounded-xl text-center">

              <FontAwesomeIcon
                icon={faChartLine}
                className="text-purple-600 text-2xl mb-2"
              />

              <p className="text-gray-600">
                Promedio
              </p>

              <p className="text-3xl font-bold text-purple-700">
                {calcularPromedio()}
              </p>

            </div>

            <div className="bg-green-50 p-5 rounded-xl text-center">

              <FontAwesomeIcon
                icon={faBook}
                className="text-green-600 text-2xl mb-2"
              />

              <p className="text-gray-600">
                Materias
              </p>

              <p className="text-3xl font-bold text-green-700">
                {totalMaterias}
              </p>

            </div>

            <div className="bg-blue-50 p-5 rounded-xl text-center">

              <p className="text-gray-600">
                Estado General
              </p>

              <p className="text-xl font-bold text-blue-700 mt-2">

                {calcularPromedio() >= 6
                  ? "Activo"
                  : "En riesgo"}

              </p>

            </div>

          </div>

        </div>

        {totalMaterias === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center text-gray-500">
            No hay calificaciones registradas
          </div>
        )}

        {/* TABLA UNIVERSIDAD */}

        {universidad.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <table className="min-w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="py-3 px-6 text-left">Materia</th>
                  <th className="py-3 px-4 text-center">Periodo</th>
                  <th className="py-3 px-4 text-center">Año</th>
                  <th className="py-3 px-4 text-center">Calificación</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {universidad.map((data) => {
                  const cal = Number(data.calificacion);
                  return (
                    <tr key={data.id} className="border-b hover:bg-purple-50">
                      <td className="py-3 px-6">{data.materia}</td>
                      <td className="py-3 px-4 text-center">{data.periodo_cuatrimestre ?? "-"}</td>
                      <td className="py-3 px-4 text-center">{data.ano_cuatrimestre ?? "-"}</td>
                      <td className="py-3 px-4 text-center font-bold">{cal}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColor(cal)}`}>
                          {obtenerEstado(cal)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLA BACHILLERATO: una fila por materia, sus 3 parciales juntos */}

        {bachillerato.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="py-3 px-6 text-left">Materia</th>
                  <th className="py-3 px-4 text-center">Parcial 1</th>
                  <th className="py-3 px-4 text-center">Parcial 2</th>
                  <th className="py-3 px-4 text-center">Parcial 3</th>
                  <th className="py-3 px-4 text-center">Promedio</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {bachillerato.map((m) => (
                  <tr key={m.materia} className="border-b hover:bg-purple-50">
                    <td className="py-3 px-6">{m.materia}</td>
                    <td className="py-3 px-4 text-center">{m.parcial1 ?? "-"}</td>
                    <td className="py-3 px-4 text-center">{m.parcial2 ?? "-"}</td>
                    <td className="py-3 px-4 text-center">{m.parcial3 ?? "-"}</td>
                    <td className="py-3 px-4 text-center font-bold">
                      {m.promedio !== null ? m.promedio.toFixed(1) : "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.promedio !== null && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColor(m.promedio)}`}>
                          {obtenerEstado(m.promedio)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </main>
  );

}