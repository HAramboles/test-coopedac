import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, CrearCuentas, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Parametros de relation
const EscenariosPruebas: CrearCuentas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    }, 
    {
        ID_OPERACION: 30
    }
];

// Pruebas

test.describe('No permitir la Creacion de una Cuenta de Ahorros sin crear una de Aportaciones - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebas) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
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

                // Cedula de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
            });
        
            test('Ir a la opcion de Crear Cuenta de Ahorros', async () => {
                // Captaciones
                await page.getByRole('menuitem').filter({hasText: 'CAPTACIONES'}).click();
        
                // Apertura de Cuentas
                await page.getByRole('menuitem').filter({hasText: 'APERTURA DE CUENTAS'}).click();
        
                // Ahorros
                await page.getByRole('menuitem').filter({hasText: 'Ahorros'}).click();
        
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
        
                // Constante con la opcion de ahorros normales
                const tipoAhorros = page.locator('text=AHORROS NORMALES');
        
                if (await tipoAhorros.isHidden()) {
                    // Si no llega el tipo de captacion, manualmente dirigise a la url de los ahorros normales
                    await page.goto(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
                } else if (await tipoAhorros.isVisible()) {
                    // Seleccionar el tipo de captacion Ahorros Normales
                    await page.locator('text=AHORROS NORMALES').click();
                }
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
            });

            if (escenario.ID_OPERACION === '') {
                // Test si el ID_OPERACION es Vacio
                test('No debe permitir Crear una Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();

                    // Debe salir un mensaje
                    await expect(page.getByRole('dialog').getByText('No tiene permisos para crear cuentas')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
                    // Skip al test
                    test.skip();
                });
            }  else if (escenario.ID_OPERACION === 10) {
                // Test si el ID_OPERACION es diferente de 30
                test('No debe permitir Crear una Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();

                    // Debe salir un mensaje
                    await expect(page.getByRole('dialog').getByText('No tiene permisos para crear cuentas')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
                    // Skip al test
                    test.skip();
                });
            } else if (escenario.ID_OPERACION === 30) {
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16/create?step=1`);
            
                    // El titulo de Registrar Cuenta debe estar visible
                    await expect(page.locator('text=CREAR CUENTA DE AHORROS')).toBeVisible();
                });
            
                test('Ingresar un Socio', async () => {
                    // Titular
                    const campoTitular = page.locator(`${selectBuscar}`);
            
                    await campoTitular?.fill(`${cedula}`);
                    // Seleccionar la opcion que aparece
                    await page.locator(`text=${cedula}`).click();
            
                    // Debe salir un mensaje de aviso
                    await expect(page.locator('text=Para continuar, debe crear una cuenta de APORTACIONES a este socio.')).toBeVisible();
            
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Se debe redirigir a la pagina de las cuentas de ahorros
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
                });
            };
            
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();
            });
        });
    };
});

