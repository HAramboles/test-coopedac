import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Parametros de la reimpresion de la resolucion aporbatoria
interface ReimpresionResolucionAprobatoria {
    ESTADO_DEFECTO: 'A' | 'D'
};

const EscenariosPrueba: ReimpresionResolucionAprobatoria[] = [
    {
        ESTADO_DEFECTO: 'A'
    },
    {
        ESTADO_DEFECTO: 'D'
    }
];

// Pruebas

test.describe('Reimpresion de resolucion aprobatoria - Pruebas con los diferentes parametros', () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test si el escenario es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: false
                });

                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json'
                });

                // Crear una page
                page = await context.newPage();

                // Eventos para la request de actividad_parametro
                await page.route(/\/actividad_parametro/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        body.data = Object.assign(body.data, escenario);
                        route.fulfill({
                            response, 
                            body: JSON.stringify(body)
                        });
                    } else {
                        route.continue();
                    }
                });

                // Ingresar a la pagina
                await page.goto(`${url_base}`);
            });

            test('Ir a la opcion de Reimprimir Resolucion Aprobatoria', async () => {
                // Negocios
                await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

                // Reimpresiones
                await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

                // Reimprimir resolucion aprobatoria
                await page.getByRole('menuitem', {name: 'Reimprimir resolución aprobatoria'}).click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_base}/reimprimir_resolucion_aprobatoria/01-3-5-6/`);
            });

            test('Reimprimir una solicitud de un socio', async () => {
                // El titulo principal debe estar visible
                await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR RESOLUCIÓN APROBATORIA'})).toBeVisible();

                if (escenario.ESTADO_DEFECTO === 'A') {
                    // Nombre y apellido de la persona almacenada en el state
                    const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                    const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                    // El estado de las solicitudes deben estar en Aprobado
                    await expect(page.locator('(//SPAN[@class="ant-select-selection-item"][text()="APROBADO"])')).toBeVisible();

                    // Buscar un socio
                    await page.locator('#form_search').fill(`${nombre} ${apellido}`);

                    // No se deben mostrar ningun resultado, porque el socio no tiene ninguna solicitud en aprobado
                    await expect(page.getByText('No hay datos')).toBeVisible();

                    // Skip al test
                    test.skip();
                } else if ( escenario.ESTADO_DEFECTO === 'D') {
                    // Nombre y apellido de la persona almacenada en el state
                    const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                    const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                    // El estado de las solicitudes deben estar en Aprobado
                    await expect(page.locator('(//SPAN[@class="ant-select-selection-item"][text()="DESEMBOLSADO"])')).toBeVisible();

                    // Buscar un socio
                    await page.locator('#form_search').fill(`${nombre} ${apellido}`);

                    // Click al boton de reimprimir
                    const botonImprimir = page.getByRole('row', {name: `${nombre} ${apellido}`}).locator('[aria-label="printer"]');
                    // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(botonImprimir).toBeVisible(),
                        await botonImprimir.click()
                    ]);

                    // Cerrar la pagina con la solicitud
                    await newPage.close();
                }
            });

            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el contex
                await context.close();
            });
        })
    }
})