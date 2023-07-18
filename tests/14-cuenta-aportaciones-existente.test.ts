import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';
import { EscenariosPruebaCrearCuentas } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Cuenta
let botonNuevaCuenta: Locator;

// Variable con la cedula de la persona
let cedula: string | null;

// Pruebas

test.describe.serial('No permitir Crear una Nueva Cuenta de Aportaciones al mismo Socio - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser, con la propiedad headless
                browser = await chromium.launch({
                    headless: false
                });
        
                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json'
                });
        
                // Crear una nueva page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[33]).length > 1) {
                        // Remplazar el body con la response con los datos de los escenarios
                        body.data[33] = Object.assign(body.data[33], escenario);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        })
                    } else {
                        route.continue();
                    };
                });
        
                // Ingresar a la url de la pagina
                await page.goto(`${url_base}`);

                // Boton de Crear Nueva Cuenta
                botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});

                // Cedula de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
            });
        
            test('Ir a Apertura de cuenta de aportaciones', async () => { 
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Captaciones
                await page.getByRole('menuitem', {name: 'Aportaciones'}).first().click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();
            });

            if (escenario.ID_OPERACION !== 30) {
                // Test si el ID_OPERACION es diferente de 30
                test('No debe permitir Crear una Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();

                    // Debe salir un mensaje
                    const mensajeError = page.getByRole('dialog').getByText('No tiene permisos para crear cuentas');
                    await expect(mensajeError).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // El mensaje debe desaparecer
                    await expect(mensajeError).not.toBeVisible();
                });
            } else if (escenario.ID_OPERACION === 30) {
                // Tests si el ID_OPERACION es 30
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1/create?step=1`);
                });
            
                test('Debe de salir un modal avisando que el titular ya tiene una cuenta de aportaciones', async () => {            
                    // El titulo de registrar cuenta deb estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();
            
                    // Ingresar el titular
                    const campoTitular = page.locator(`${selectBuscar}`);
            
                    await campoTitular?.fill(`${cedula}`);
                    // Click a la opcion que coincide con lo buscado
                    await page.locator(`text=${cedula}`).click();
            
                    // Debe salir un modal luego de ingresar el titular
                    const modal = page.locator('text=Este cliente ya posee una cuenta de este tipo.');
                    await expect(modal).toBeVisible();
            
                    // Aceptar y regresar a la pagina de aportaciones
                    const botonAceptar = page.locator('text=Aceptar');
                    await botonAceptar.click();
            
                    // El modal debe desaparecer
                    await expect(modal).not.toBeVisible();
            
                    // Debe regresar atras y la URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
                });
            };
        
            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});
