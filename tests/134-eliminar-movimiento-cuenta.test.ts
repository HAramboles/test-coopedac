import { APIResponse, Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base, browserConfig, selectBuscar, dataEliminar } from './utils/dataTests';
import { EscenariosEliminarMovimientos } from './utils/interfaces';
import { url_consulta_movimientos_cuentas } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Variables del buscador
let buscadorCuenta: Locator;

// Cedula de la persona 
let cedula: string | null;

// Pruebas
test.describe.serial('Eliminar Movimiento en Consulta Movimientos Cuenats - Pruebas con los diferentes paramtros', async () => {
    for (const escenario of EscenariosEliminarMovimientos) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
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

                // Eventos para la request relation
                await page.route(/\/relation/, async route =>{
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[37]).length > 1) {
                        // Remplazar el body con la response con los datos de los escenarios
                        body.data[37] = Object.assign(body.data[37], escenario);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body)
                        });
                    } else {   
                        route.continue();
                    };
                });

                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Cedula de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));

                // Input para buscar las cuentas del socio
                buscadorCuenta = page.locator('#rc_select_1');
            });

            test('Ir a la opcion de Consulta Movimientos Cuenta', async () => {
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Consultas
                await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();
        
                // Consulta Movimientos Cuenta
                await page.getByRole('menuitem', {name: 'Consulta Movimientos Cuenta'}).click();
        
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);
            });

            test('Buscar la Cuenta de Ahorros Normales de la persona', async () => {
                // Seleccionar un tipo de cuenta a buscar
                await buscadorCuenta.click();
                // Click a la opcion de cuenta de Ahorros Normales
                await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

                // Buscar una cuenta del mismo socio
                await page.locator(`${selectBuscar}`).fill(`${cedula}`);
                // Elegir la Cuenta de Ahorros Normales del Socio
                await page.getByText('| AHORROS NORMALES |').click();

                // La URL no debe cambiar
                await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

                // El tipo de captacion debe ser de Ahorros Normales
                await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('AHORROS NORMALES');

                // El estado debe estar en Activa
                await expect(page.getByText('ACTIVA')).toBeVisible();

                // Titulo movimiento de la cuenta debe estar visible
                await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

                // Tabla de los movimientos de la cuenta
                await expect(page.getByRole('columnheader', {name: 'Documento'})).toBeVisible();
                await expect(page.getByRole('columnheader', {name: 'Fecha'})).toBeVisible();
                await expect(page.getByRole('columnheader', {name: 'Comentario'})).toBeVisible();
                await expect(page.getByRole('columnheader', {name: 'Clase Transacción'})).toBeVisible();
                await expect(page.getByRole('columnheader', {name: 'Depósitos'})).toBeVisible();
                await expect(page.getByRole('columnheader', {name: 'Retiros'})).toBeVisible();
                await expect(page.getByRole('columnheader', {name: 'Balance'})).toBeVisible();
                await expect(page.getByRole('columnheader', {name: 'Acciones'})).toBeVisible();
            });

            if (escenario.ID_OPERACION !== 34) {
                test('El boton de Anular Movimiento no debe estar visible', async () => {
                    // El boton de Anular no debe estar en la tabla de movimientos
                    await expect(page.locator(`${dataEliminar}`)).not.toBeVisible();
                });
            } else if (escenario.ID_OPERACION === 34) {
                test('Anular un Movimiento de la Cuenta', async () => {
                    // El boton de Anular debe estar en la tabla de movimientos
                    await expect(page.locator(`${dataEliminar}`).nth(1)).toBeVisible();

                    // Click al boton de Anular
                    await page.locator(`${dataEliminar}`).nth(1).click();

                    // Debe aparecer un modal para colocar la razon de la anulacion
                    await expect(page.locator('text=Razón anulación')).toBeVisible();

                    // Digitar la razon de la anulacion
                    await page.locator('#form_CONCEPTO_ANULACION').fill('Movimiento Erroneo');

                    // Click al boton de Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Debe aparecer un mensaje modal de confirmacion
                    await expect(page.locator('text=Se ha anulado correctamente')).toBeVisible();

                    // Click al boton de Aceptar del mensaje modal
                    await page.getByRole('button', {name: 'Aceptar'}).click();
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
