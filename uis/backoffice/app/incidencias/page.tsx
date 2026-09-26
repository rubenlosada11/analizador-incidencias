import type { Metadata } from "next";
import { AnalizadorIncidencias } from "@/components/incidencias/AnalizadorIncidencias";

export const metadata: Metadata = {
  title: "Análisis de incidencias | TrackFlow Tech",
};

export default function PaginaIncidencias() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-800">Atención postventa</p>
        <h1 className="mt-2 font-heading text-3xl tracking-tight text-slate-900 sm:text-4xl">Análisis de incidencias</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Sube el CSV exportado del helpdesk. Se validan los registros según las reglas de TrackFlow, los inválidos se
          excluyen de las métricas y el resultado se puede descargar en CSV.
        </p>
      </header>
      <AnalizadorIncidencias />
    </div>
  );
}
