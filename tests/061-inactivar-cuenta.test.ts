import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, formBuscar, browserConfig } from './utils/dataTests';
import { EscenariosPruebasActivarInactivarCuentas } from './utils/interfaces';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Inactivar Cuenta y de Aceptar
let botonActivarInactivar: Locator;
let botonAceptar: Locator;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Inactivar una Cuenta del Socio - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebasActivarInactivarCuentas) {
        test.describe(`Test cuando el parametro sea: ${Object.values(escenarios).toString()}`, () => {
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

                // Crear una page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[27]).length > 1) { 
                        // Reemplazar el body con la response con los datos de los escenario
                        body.data[27] = Object.assign(body.data[27], escenarios);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        })
                    } else {
                        route.continue();
                    };
                });

                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Cedula, nombre y apellido de la persona guardada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Boton de Inactivar Cuentas y de Aceptar
                botonActivarInactivar = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'check-circle'});
                botonAceptar = page.getByRole('button', {name: 'Aceptar'});
            });

            test('Ir a la opcion de Apertura de cuentas de Ahorros', async () => {
                // Boton de Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Boton de Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Boton de Ahorros
                await page.getByRole('menuitem', {name: 'Ahorros'}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros`);
        
                // El titulo de ahorros debe estar visible
                await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
            });
        
            test('Seleccionar un tipo de captaciones', async () => {
                // El titulo de tipo de captaciones debe estar visible
                await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();
        
                // Boton de seleccionar captaciones
                const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
                await expect(botonCaptaciones).toBeVisible();
                // Click al boton
                await botonCaptaciones.click();

                // Click a la opcion de Ahorros por Nomina
                const opcionAhorrosNomina = page.locator('text=AHORROS POR NOMINA');
                await expect(opcionAhorrosNomina).toBeVisible();
                await opcionAhorrosNomina.click();
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/19`);

                // El tipo de captacion de ahorros por nomina debe estar visible
                await expect(page.locator('#form').getByTitle('AHORROS POR NOMINA')).toBeVisible();
            });
            
            test('Buscar la cuenta del Socio', async () => {
                // Ingresar el nombre del socio
                await page.locator(`${formBuscar}`).fill(`${cedula}`);

                // Debe mostrarse la cuenta del socio
                await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
            });

            if (escenarios.ID_OPERACION !== 23) {
                // Test cuando el ID_OPERACION sea diferente de 23
                test('No debe permitir Inactivar una cuenta', async () => {
                    // Debe mostrarse el boton de Inactivar Cuenta
                    await expect(botonActivarInactivar).toBeVisible();

                    // Click al boton de Inactivar Cuenta
                    await botonActivarInactivar.click();

                    // Debe salir un modal
                    const modal = page.locator('text=No tiene autorización para realizar esta acción');
                    await expect(modal).toBeVisible();
                    
                    // Click al boton de Aceptar del modal
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // El modal debe desaparecer
                    await expect(modal).not.toBeVisible();
                });
            } else if (escenarios.ID_OPERACION === 23) {
                // Test cuando el ID_OPERACION sea 23
                test('Debe permitir Inactivar una cuenta', async () => {
                    // Debe mostrarse el boton de Inactivar Cuenta
                    await expect(botonActivarInactivar).toBeVisible();

                    // Click al boton de Inactivar Cuenta
                    await botonActivarInactivar.click();

                    // Debe salir un modal de confirmacion
                    await expect(page.locator('text=¿Está seguro de Inactivar esta cuenta?')).toBeVisible();

                    // Click al boton de Aceptar del modal
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Debe salir una alerta de exito
                    await expect(page.locator('text=Operación Exitosa')).toBeVisible();
                });

                test('Buscar la cuenta en la lista de cuentas inactivas', async () => {
                    // Click al radio de cuentas inactivas
                    const radioInactivas = page.getByText('Inactivas', {exact: true});
                    await expect(radioInactivas).toBeVisible();
                    await radioInactivas.click();

                    // Buscar la cuenta del socio 
                    await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

                    // Debe mostrarse la cuenta del socio
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
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

