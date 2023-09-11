import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_reversar_pago_prestamo } from './utils/urls';
import { url_base, browserConfig } from './utils/dataTests';
import { EscenariosReversarPagoPrestamo } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Reversar Pago a Prestamo - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosReversarPagoPrestamo) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: browserConfig.headless,
                    args: browserConfig.args
                });

                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json'
                });

                // Crear la page
                page = await context.newPage();

                // Eventos para la request actividad_parametro
                await page.route(/\/actividad_parametro/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());
                    
                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data = Object.assign(body.data, escenarios);
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

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            });

            test('Ir a la opcion de Reversar Pago a Prestamo', async () => {
                // Tesoreria
                await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

                // Cajas
                await page.getByRole('menuitem', {name: 'CAJAS'}).click();

                // Reversiones
                await page.getByRole('menuitem', {name: 'REVERSIONES'}).click();

                // Reversar pago a prestamo
                await page.getByRole('menuitem', {name: 'Reversar pago a prestamo'}).click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_reversar_pago_prestamo}`);
            });

            if (escenarios.PERMITE_REVERSION !== 'S') {
                // Tests cuando PERMITE_REVERSION es diferente de 'S'
                test('Prueba A', async () => {
                    await expect(page.locator('h1').filter({hasText: 'REVERSAR PAGO A PRESTAMO'})).toBeVisible();
                });
            } else if (escenarios.PERMITE_REVERSION === 'S') {
                // Tests cuando PERMITE_REVERSION es igual a 'S'
                test('Prueba B', async () => {
                    await expect(page.locator('h1').filter({hasText: 'REVERSAR PAGO A PRESTAMO'})).toBeVisible();
                });
            };

            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});
