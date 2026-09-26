// Pruebas extremo a extremo del analizador de incidencias en un navegador real.
//
// Requisitos: la API (services/api, puerto 8000) y el backoffice (puerto 3002) arrancados,
// y Microsoft Edge instalado (o el canal indicado en E2E_BROWSER_CHANNEL, p. ej. "chrome").
// Ejecutar desde uis/backoffice: npm run test:e2e

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3002";
const CANAL = process.env.E2E_BROWSER_CHANNEL ?? "msedge";
const PYTHON = process.env.PYTHON ?? "python";

const RAIZ_REPO = fileURLToPath(new URL("../../../", import.meta.url));
const CSV_REAL = join(RAIZ_REPO, "scripts", "incidents-trackflow.csv");
const SCRIPT = join(RAIZ_REPO, "scripts", "analyze.py");
const TEMPORAL = mkdtempSync(join(tmpdir(), "backoffice-e2e-"));

let navegador;
let pagina;

const texto = async (selector) => (await pagina.locator(selector).innerText()).replace(/\s+/g, " ");
const alerta = () => pagina.locator('form [role="alert"]');
const botonAnalizar = () => pagina.getByRole("button", { name: /Analizar/ });
const seleccionar = (ruta) => pagina.locator('input[type="file"]').setInputFiles(ruta);

function fichero(nombre, contenido) {
  const ruta = join(TEMPORAL, nombre);
  writeFileSync(ruta, contenido);
  return ruta;
}

async function analizarCsvReal() {
  await seleccionar(CSV_REAL);
  await botonAnalizar().click();
  await pagina.getByRole("heading", { name: "Resumen general" }).waitFor();
}

before(async () => {
  try {
    const salud = await fetch(`${BASE_URL}/api/health`);
    assert.ok(salud.ok);
  } catch {
    throw new Error(`No responde ${BASE_URL}/api/health. Arranca la API (puerto 8000) y el backoffice (puerto 3002).`);
  }
  navegador = await chromium.launch({ channel: CANAL });
});

after(async () => {
  await navegador?.close();
});

beforeEach(async () => {
  await pagina?.close();
  pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await pagina.goto(`${BASE_URL}/incidencias`);
});

describe("navegación", () => {
  test("el menú lateral lleva al analizador y marca la sección activa", async () => {
    await pagina.goto(`${BASE_URL}/`);
    const menu = pagina.locator('nav[aria-label="Secciones del backoffice"]');
    await menu.getByRole("link", { name: "Análisis de incidencias" }).click();
    await pagina.waitForURL("**/incidencias");
    assert.equal(await menu.locator('[aria-current="page"]').innerText(), "Análisis de incidencias");
  });
});

describe("carga del fichero", () => {
  test("avisa si se analiza sin seleccionar fichero", async () => {
    await botonAnalizar().click();
    assert.match(await alerta().innerText(), /Selecciona un fichero CSV antes de analizar/);
  });

  test("rechaza ficheros que no son .csv sin llamar a la API", async () => {
    await seleccionar(fichero("datos.txt", "hola"));
    assert.match(await alerta().innerText(), /extensión \.csv/);
  });

  test("muestra el error de la API con un CSV vacío", async () => {
    await seleccionar(fichero("vacio.csv", ""));
    await botonAnalizar().click();
    await alerta().waitFor();
    assert.match(await alerta().innerText(), /El fichero está vacío/);
  });

  test("muestra el indicador de carga mientras se analiza", async () => {
    await pagina.route("**/api/incidents/analyze", async (ruta) => {
      await new Promise((r) => setTimeout(r, 1000));
      await ruta.continue();
    });
    await seleccionar(CSV_REAL);
    await botonAnalizar().click();
    const cargando = pagina.getByRole("button", { name: "Analizando…" });
    await cargando.waitFor({ timeout: 900 });
    assert.equal(await cargando.isDisabled(), true);
    await pagina.getByRole("heading", { name: "Resumen general" }).waitFor();
  });
});

describe("resultados con el CSV real (valores de CONTEXT.es.md)", () => {
  test("resumen general", async () => {
    await analizarCsvReal();
    const resumen = await texto("#resumen");
    for (const valor of ["Registros procesados", "100", "95", "5", "3,06", "52 de 52"]) {
      assert.ok(resumen.includes(valor), `falta "${valor}" en: ${resumen}`);
    }
  });

  test("por categoría y por estado", async () => {
    await analizarCsvReal();
    const categoria = await texto("#categoria");
    for (const fila of ["LOST_PARCEL 14 · 14,7 %", "DELAYED_DELIVERY 38 · 40,0 %", "WRONG_ADDRESS 19 · 20,0 %", "RETURN_REQUEST 17 · 17,9 %", "DAMAGE 7 · 7,4 %"]) {
      assert.ok(categoria.includes(fila), `falta "${fila}"`);
    }
    const estado = await texto("#estado");
    for (const fila of ["OPEN 29 · 30,5 %", "CLOSED 52 · 54,7 %", "DISCARDED 14 · 14,7 %"]) {
      assert.ok(estado.includes(fila), `falta "${fila}"`);
    }
  });

  test("satisfacción", async () => {
    await analizarCsvReal();
    const satisfaccion = await texto("#satisfaccion");
    for (const valor of ["media 3,06 / 5", "1 · Muy insatisfecho 6", "2 · Insatisfecho 11", "3 · Neutral 15", "4 · Satisfecho 14", "5 · Muy satisfecho 6", "US 28 28 2,96", "ES 24 24 3,17"]) {
      assert.ok(satisfaccion.includes(valor), `falta "${valor}"`);
    }
  });

  test("registros inválidos identificados sin datos personales", async () => {
    await analizarCsvReal();
    const invalidos = await texto("#invalidos");
    assert.ok(invalidos.includes("5 registros inválidos o incompletos"));
    for (const id of ["TRF-000003", "TRF-000025", "TRF-000042", "TRF-000068", "TRF-000097"]) {
      assert.ok(invalidos.includes(id), `falta ${id}`);
    }
    assert.ok(!(await pagina.locator("main").innerText()).includes("@"), "la página muestra un correo");
  });

  test("cruces y desgloses extra", async () => {
    await analizarCsvReal();
    assert.ok((await texto("#cruces")).includes("DHL_US 6 2 4 4 0 16"));
    assert.ok((await texto("#temporal")).includes("Semana 2 (08/01–14/01) 31"));
  });
});

describe("descarga", () => {
  test("descarga results.csv idéntico al que exporta el script", async () => {
    await analizarCsvReal();
    const [descarga] = await Promise.all([
      pagina.waitForEvent("download"),
      pagina.getByRole("button", { name: "Descargar resultados CSV" }).click(),
    ]);
    assert.equal(descarga.suggestedFilename(), "results.csv");
    const desdeNavegador = join(TEMPORAL, "navegador.csv");
    await descarga.saveAs(desdeNavegador);

    const desdeScript = join(TEMPORAL, "script.csv");
    execFileSync(PYTHON, [SCRIPT, CSV_REAL, "--output", desdeScript], { input: "s\n", stdio: ["pipe", "ignore", "inherit"] });
    assert.ok(readFileSync(desdeNavegador).equals(readFileSync(desdeScript)), "la descarga difiere del CSV del script");
  });
});

describe("errores de la API (respuestas simuladas)", () => {
  test("API caída: mensaje de conexión", async () => {
    await pagina.route("**/api/incidents/analyze", (ruta) => ruta.fulfill({ status: 500, body: "Internal Server Error" }));
    await seleccionar(CSV_REAL);
    await botonAnalizar().click();
    await alerta().waitFor();
    assert.match(await alerta().innerText(), /No se ha podido conectar con la API/);
  });

  test("descarga sin análisis en la API: muestra el 404", async () => {
    await analizarCsvReal();
    await pagina.route("**/api/incidents/results/export", (ruta) =>
      ruta.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "Todavía no se ha analizado ningún fichero." }) }),
    );
    await pagina.getByRole("button", { name: "Descargar resultados CSV" }).click();
    const aviso = pagina.locator('[role="alert"]').filter({ hasText: "Todavía no se ha analizado" });
    await aviso.waitFor();
  });
});

describe("diseño adaptable", () => {
  test("en móvil (390 px) no hay scroll horizontal", async () => {
    await pagina.setViewportSize({ width: 390, height: 844 });
    await analizarCsvReal();
    assert.ok((await pagina.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  });
});
