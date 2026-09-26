import Link from "next/link";

export default function Inicio() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-800">TrackFlow Tech</p>
        <h1 className="mt-2 font-heading text-3xl tracking-tight text-slate-900 sm:text-4xl">Backoffice</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Herramientas internas para los equipos de TrackFlow. Selecciona una sección en el menú.
        </p>
      </header>

      <Link
        href="/incidencias"
        className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-800">Atención postventa</p>
        <h2 className="mt-2 font-heading text-xl text-slate-900">Análisis de incidencias</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Sube el CSV exportado del helpdesk para validar los registros y ver el volumen por categoría, estado,
          país y transportista, y el índice de satisfacción.
        </p>
        <span className="mt-4 inline-block text-sm font-bold text-blue-700 group-hover:underline">
          Abrir analizador →
        </span>
      </Link>
    </div>
  );
}
