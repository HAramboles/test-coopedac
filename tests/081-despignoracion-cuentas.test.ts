import { APIResponse, Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { selectBuscar, tipoPignoracion, } from './utils/data/inputsButtons';
import { EscenariosPruebasAgregarEliminarPignoracion } from './utils/dataPages/interfaces';
import { url_base, url_pignoracion_cuentas } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Despignoracion de Cuentas - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebasAgregarEliminarPignoracion) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
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
                    };
                });
        
                // Ingresar a la pagina
                await page.goto(`${url_base}`);
        
                // Cedula de la persona almacenados en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
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

            test('Datos de la cuenta', async () => {
                // Tipo de cuenta
                await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');
        
                // Balance
                await expect(page.locator('#form_BALANCE')).toHaveValue('RD$ 1,901,200');
        
                // Transito
                await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue('RD$ 0');
        
                // Pignorado
                await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('RD$ 250');
        
                // Disponible
                await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue('RD$ 1,900,750');
        
                // Estado de Cuenta
                await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');
            });

            if (escenario.ID_OPERACION !== 29) {
                test('No debe permitir Despignorar un Monto', async () => {
                    // El selector de tipo no debe mostarse
                    await expect(page.locator(`${tipoPignoracion}`)).not.toBeVisible();
                });
            } else if (escenario.ID_OPERACION === 29) {
                test('Despignorar un monto', async () => {
                    // Elegir el tipo de pignoracion a realizar
                    await page.locator(`${tipoPignoracion}`).click();
                    // Elegir despignoracion
                    await page.getByRole('option', {name: 'Despignorar (-)'}).click();
            
                    // Monto
                    const montoPignoracion = page.locator('#form_MONTO');
                    await montoPignoracion.fill('150');
            
                    // Descripcion Pignoracion
                    const descripcionPignoracion = page.locator('#form_DESC_PIGNORACION');
                    await descripcionPignoracion.fill('Despignorar 150 pesos');
            
                    // Click en Guardar
                    const botonGuardar = page.getByRole('button', {name: 'Guardar'});
                    await expect(botonGuardar).toBeVisible();
                    await botonGuardar.click();

                    // Debe aparecer un menaje modal de confirmacion
                    await expect(page.locator('text=¿Seguro que desea realizar la acción?')).toBeVisible();

                    // Click al boton de Aceptar del mensaje modal
                    await page.getByRole('button', {name: 'check Aceptar'}).click();
            
                    // Debe salir un mensaje modal de operacion exitosa
                    await expect(page.locator('text=Se ha creado el registro.')).toBeVisible();
            
                    // Click al boton de Aceptar del mensaje modal
                    await page.getByRole('button', {name: 'check Aceptar'}).first().click();
            
                    // Los 150 pesos deben estar en la tabla de las pignoraciones y despignoraciones
                    await expect(page.getByRole('row', {name: 'Despignorar 150 pesos Activo RD$ 150.00'})).toBeVisible();
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

