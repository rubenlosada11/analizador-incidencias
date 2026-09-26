import type { ResultadoAnalisis } from "@/types/incidencias";

// Rutas relativas: next.config.ts reenvía /api/* a la API (services/api).
const URL_ANALISIS = "/api/incidents/analyze";
const URL_EXPORTACION = "/api/incidents/results/export";

const SIN_CONEXION =
  "No se ha podido conectar con la API de análisis. Comprueba que está arrancada (services/api, puerto 8000).";

export class ErrorApi extends Error {}

async function mensajeDeError(respuesta: Response): Promise<string> {
  try {
    const datos = await respuesta.json();
    if (typeof datos?.detail === "string") return datos.detail;
  } catch {
    // Respuesta sin JSON: normalmente la API no está disponible y responde el proxy de Next.js.
  }
  return respuesta.status >= 500 ? SIN_CONEXION : `La API ha respondido con un error (HTTP ${respuesta.status}).`;
}

async function peticion(url: string, opciones?: RequestInit): Promise<Response> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new ErrorApi(SIN_CONEXION);
  }
  if (!respuesta.ok) throw new ErrorApi(await mensajeDeError(respuesta));
  return respuesta;
}

export async function analizarCsv(archivo: File): Promise<ResultadoAnalisis> {
  const formulario = new FormData();
  formulario.append("file", archivo);
  const respuesta = await peticion(URL_ANALISIS, { method: "POST", body: formulario });
  return respuesta.json();
}

export async function descargarResultados(): Promise<void> {
  const respuesta = await peticion(URL_EXPORTACION);
  const disposicion = respuesta.headers.get("Content-Disposition") ?? "";
  const nombre = /filename="?([^";]+)"?/.exec(disposicion)?.[1] ?? "results.csv";

  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
