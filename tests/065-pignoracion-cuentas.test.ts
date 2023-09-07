import { APIResponse, Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { formatDate } from './utils/fechas';
import { url_base, ariaCerrar, selectBuscar, browserConfig } from './utils/dataTests';
import { EscenariosPruebasAgregarEliminarPignoracion } from './utils/interfaces';
import { url_pignoracion_cuentas } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Inputs para pignorar un monto de la cuenta
let fechaPignoracion: Locator;
let razonPignoracion: Locator;
let montoPignoracion: Locator;
let descripcionPignoracion: Locator;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pignoracion de Cuentas - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebasAgregarEliminarPignoracion) {
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
        
                // Crear una page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[32]).length > 1) {
                        // Reemplazar el body con la response con los datos del escenario
                        body.data[32] = Object.assign(body.data[32], escenario);
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
        
                // Nombre y apellido de la persona almacenados en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));

                // Inputs para pignorar un monto de la cuenta
                fechaPignoracion = page.locator('#form_FECHA_PIGNORACION');
                razonPignoracion = page.locator('div').filter({ hasText: /^OTRAS RAZONES$/ }).nth(4);
                montoPignoracion = page.locator('#form_MONTO');
                descripcionPignoracion = page.locator('#form_DESC_PIGNORACION');
            });
        
            test('Ir a la opcion de Pignoracion de Cuentas', async () => {
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Pignoracion de cuentas
                await page.getByRole('menuitem', {name: 'Pignoración de Cuentas'}).click();
        
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_pignoracion_cuentas}`);
            });

            test('Buscar una cuenta de un Socio', async () => {
                // Titulo principal
                await expect(page.locator('h1').filter({hasText: 'PIGNORACIÓN DE CUENTAS'})).toBeVisible();
        
                // Buscar al socio
                await page.locator(`${selectBuscar}`).fill(`${cedula}`);
                // Elegir la cuenta de Ahorro
                await page.locator('text=AHORROS NORMALES').click();
            });
            
            test.skip('Datos de la cuenta', async () => {
                // Tipo de cuenta
                await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');
        
                // // Balance
                // await expect(page.locator('#form_BALANCE')).toHaveValue('RD$ 24,100');
        
                // // Transito
                // await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue('RD$ 0');
        
                // // Pignorado
                // await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('RD$ 0');
        
                // // Disponible
                // await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue('RD$ 23,900');
        
                // Estado de Cuenta
                await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');
            });

            if (escenario.ID_OPERACION !== 29) {
                // Test cuando ID_OPERACION es diferente de 29
                test('No se deben mostrar los inputs para pignorar un monto', async () => {
                    // Fecha de pignoracion
                    await expect(fechaPignoracion).not.toBeVisible();

                    // Razon de pignoracion
                    await expect(razonPignoracion).not.toBeVisible();

                    // Monto de pignoracion
                    await expect(montoPignoracion).not.toBeVisible();

                    // Descripcion de pignoracion
                    await expect(descripcionPignoracion).not.toBeVisible();
                });
            } else if (escenario.ID_OPERACION === 29) {
                // Test cuando ID_OPERACION es igual a 29
                test('Pignorar un monto', async () => {
                    // Fecha de pignoracion
                    await expect(fechaPignoracion).toHaveValue(`${formatDate(new Date())}`);
            
                    // Cambiar la razon a motivos legales
                    await razonPignoracion.click();
                    await page.locator('text=MOTIVOS LEGALES').click();
            
                    // Monto
                    await montoPignoracion.fill('100');
            
                    // Descripcion Pignoracion
                    await descripcionPignoracion.fill('Pignorar 100 pesos');
            
                    // Click en Guardar
                    const botonGuardar = page.getByRole('button', {name: 'Guardar'});
                    await expect(botonGuardar).toBeVisible();
                    await botonGuardar.click();
            
                    // Debe salir un mensaje de que se realizo correctamente la operacion
                    await expect(page.locator('text=Captaciones congeladas almacenada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${ariaCerrar}`).click();
            
                    // Los 100 pesos deben estar en estado congelado
                    await expect(page.getByRole('row', {name: 'CONGELADO RD$ 100.00'})).toBeVisible();
                });
            
                test('Pignorar otro Monto', async () => {
                    // Monto
                    await montoPignoracion.fill('150');
            
                    // Descripcion Pignoracion
                    await descripcionPignoracion.fill('Pignorar 150 pesos');
            
                    // Click en Guardar
                    const botonGuardar = page.getByRole('button', {name: 'Guardar'});
                    await expect(botonGuardar).toBeVisible();
                    await botonGuardar.click();
            
                    // Debe salir un mensaje de que se realizo correctamente la operacion
                    await expect(page.locator('text=Captaciones congeladas almacenada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${ariaCerrar}`).click();
            
                    // Los 150 pesos deben estar en estado congelado
                    await expect(page.getByRole('row', {name: 'CONGELADO RD$ 150.00'})).toBeVisible();
                });
            };
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar el context
                await context.close();
        
                // Cerrar la paga
                await page.close();
            });
        });
    };
});
