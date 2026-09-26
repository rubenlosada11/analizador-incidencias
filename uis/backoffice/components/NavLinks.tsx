"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

interface NavLinksProps {
  variante: "lateral" | "movil";
}

const ESTILOS = {
  lateral: {
    base: "block rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
    activo: "bg-blue-800 text-white",
    inactivo: "text-blue-100 hover:bg-blue-900 hover:text-white",
  },
  movil: {
    base: "block shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
    activo: "border-blue-700 bg-blue-700 text-white",
    inactivo: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  },
} as const;

export function NavLinks({ variante }: NavLinksProps) {
  const ruta = usePathname();
  const estilos = ESTILOS[variante];

  return (
    <ul className={variante === "lateral" ? "space-y-1" : "flex gap-2"}>
      {NAV_ITEMS.map((item) => {
        const activo = item.href === "/" ? ruta === "/" : ruta.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={`${estilos.base} ${activo ? estilos.activo : estilos.inactivo}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
