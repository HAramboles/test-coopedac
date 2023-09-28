import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, selectBuscar, browserConfig } from './utils/dataTests';
import { EscenariosPruebaCrearCuentas } from './utils/interfaces';
import { url_cuentas_ahorros, url_cuentas_ahorros_normales } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Cuenta
let botonNuevaCuenta: Locator;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('No permitir la Creacion de una Cuenta de Ahorros sin crear una de Aportaciones - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
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
                    if (Object.keys(body?.data[33]).length > 1) {
                        // Reemplazar el body con la response con los datos del escenario
                        body.data[33] = Object.assign(body.data[33], escenario);
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

                // Boton de Crear Nueva Cuenta
                botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});

                // Cedula de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
            });
        
            test('Ir a la opcion de Crear Cuenta de Ahorros', async () => {
                // Captaciones
                await page.getByRole('menuitem').filter({hasText: 'CAPTACIONES'}).click();
        
                // Apertura de Cuentas
                await page.getByRole('menuitem').filter({hasText: 'APERTURA DE CUENTAS'}).click();
        
                // Ahorros
                await page.getByRole('menuitem').filter({hasText: 'Ahorros'}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_cuentas_ahorros}`);
        
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

                // Click a la opcion de Ahorros Normales
                const opcionAhorrosNormales = page.locator('text=AHORROS NORMALES');
                await expect(opcionAhorrosNormales).toBeVisible();
                await opcionAhorrosNormales.click();
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}`);

                // El tipo de captacion de ahorros normales debe estar visible
                await expect(page.locator('#form').getByTitle('AHORROS NORMALES')).toBeVisible();
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
            }  else if (escenario.ID_OPERACION === 30) {
                // Tests si el ID_OPERACION es igual a 30
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}/create?step=1`);
            
                    // El titulo de Registrar Cuenta debe estar visible
                    await expect(page.locator('text=CREAR CUENTA DE AHORROS')).toBeVisible();
                });
            
                test('No debe permitir crear una Cuenta de Ahorros sin tener una de Aportaciones', async () => {
                    // Titular
                    const campoTitular = page.locator(`${selectBuscar}`);
            
                    await campoTitular?.fill(`${cedula}`);
                    // Seleccionar la cedula de la persona
                    await page.locator(`text=${cedula}`).click();

                    // Debe salir un modal de aviso
                    await expect(page.getByText('Información')).toBeVisible();
            
                    // Mensaje del modal
                    await expect(page.locator('text=Para continuar, debe crear una cuenta de APORTACIONES a este socio.')).toBeVisible();
            
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Se debe redirigir a la pagina de las cuentas de ahorros
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}`);

                    // El titulo de ahorros debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
                });

                test.skip('Se deben ver los demas tipos de cuentas en el Selector Tipo Cuenta', async () => {
                    // Boton de seleccionar captaciones
                    const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
                    await expect(botonCaptaciones).toBeVisible();
                    // Click al boton
                    await botonCaptaciones.click();

                    // Tipos de cuentas
                    await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();
                    await expect(page.locator('text=ORDEN DE PAGO')).toBeVisible();
                    await expect(page.locator('text=AHORROS INFANTILES')).toBeVisible();
                    await expect(page.locator('text=AHORROS POR NOMINA')).toBeVisible();
                });

                test.skip('Las opciones con los tipos de captacion deben estar visibles', async () => {
                    // Click al selector de tipos captacion
                    await expect(page.locator('#form').getByTitle('AHORROS NORMALES')).toBeVisible();
                    await page.locator('#form').getByTitle('AHORROS NORMALES').click();

                    // Todos los tipos de captacion deben estar visibles
                    await expect(page.getByRole('menuitem', {name: 'AHORROS NORMALES'})).toBeVisible();
                    await expect(page.getByRole('menuitem', {name: 'AHORROS POR NOMINA'})).toBeVisible();
                    await expect(page.getByRole('menuitem', {name: 'AHORROS INFANTILES'})).toBeVisible();
                    await expect(page.getByRole('menuitem', {name: 'ORDEN DE PAGO'})).toBeVisible();
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

