import Image from "next/image";
import { NavLinks } from "@/components/NavLinks";

export function Sidebar() {
  return (
    <aside className="hidden bg-blue-950 text-blue-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-8 lg:p-5">
      <div className="rounded-xl bg-white p-3">
        <Image
          src="/logo/TrackFlow_Logo1_Full.png"
          alt="Logo de TrackFlow"
          width={1190}
          height={264}
          priority
          className="h-auto w-full"
        />
      </div>

      <nav aria-label="Secciones del backoffice">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.17em] text-blue-300">Backoffice</p>
        <NavLinks variante="lateral" />
      </nav>

      <p className="mt-auto px-3 text-xs leading-relaxed text-blue-300">
        TrackFlow Tech · Uso interno. Los CSV se procesan en la API interna; no se envían a servicios externos.
      </p>
    </aside>
  );
}
