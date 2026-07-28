import { supabase } from "../supabaseClient";

/**
 * Consulta si el módulo de Seguimiento Emocional está habilitado
 * (interruptor controlado desde el Portal del Psicólogo).
 *
 * Si ocurre un error de lectura, se asume habilitado para no
 * bloquear al alumno por una falla temporal de la consulta.
 */
export async function isSeguimientoEmocionalHabilitado() {
  const { data, error } = await supabase
    .from("configuracion_sistema")
    .select("seguimiento_emocional_habilitado")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error al consultar configuración del sistema:", error);
    return true;
  }

  return data?.seguimiento_emocional_habilitado ?? true;
}
