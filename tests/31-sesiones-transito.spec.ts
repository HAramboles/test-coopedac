import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Parametros de la sesiones en transito
interface SesionesTransitoParametros {
    ID_TIPO_SESION: '1' | ''
};

const EscenariosPrueba: SesionesTransitoParametros[] = [
    {
        ID_TIPO_SESION: '1'
    },
    {
        ID_TIPO_SESION: ''
    }
];

// Pruebas

test.describe('Sesiones en Transito - Pruebas con los diferentes parametros', () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: false,
                });

                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json',
                });

                // Crear el page
                page = await context.newPage();

                // Eventos para la request actividad_parametro
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
                            body: JSON.stringify(body),
                        });
                    } else {
                        route.continue();
                    }
                });

                // Ingresar a la pagina
                await page.goto(`${url_base}`);
            });

            // Nombre y apellido de la persona alamcenado en el state
            const nombre = page.evaluate(() => window.localStorage.getItem('nombrePersona'));
            const apellido = page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            
            test('Ir a la opcion de Sesiones en Transito', async () => {
                // Tesoreria
                await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

                // Cajas
                await page.getByRole('menuitem', {name: 'CAJAS'}).click();

                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

                // Sesiones en Transito
                await page.getByRole('menuitem', {name: 'Sesiones en Tránsito', exact: true}).click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_base}/sesiones_transito/01-4-1-2-1/`);
            });

            test('Liberar una Sesion', async () => {                
                if (escenario.ID_TIPO_SESION !== '') {
                    // El nombre de la persona debe estar visible
                    await expect(page.getByRole('row', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Boton Liberar Sesion
                    const liberarSesion = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'Liberar Sesión'});
                    // Debe estar visiblr
                    await expect(liberarSesion).toBeVisible();
                    // Click al boton
                    await liberarSesion.click();
            
                    // Debe salir un modal de confirmacion
                    await expect(page.locator('text=¿Está seguro de que desea procedercon esta acción?')).toBeVisible();
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Debe salir un mensaje de confirmacion
                    await expect(page.locator('text=Sesiones en transito actualizada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator('[data-icon="close"]').click();
            
                    // El boton de liberar sesion no se debe mostrar
                    await expect(liberarSesion).not.toBeVisible();
                } else if (escenario.ID_TIPO_SESION === '') {
                    // Skip al test
                    test.skip();
                }
            });

            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    }
});
