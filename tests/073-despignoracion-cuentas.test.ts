import { APIResponse, Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base, selectBuscar, browserConfig, dataCheck, contextConfig } from './utils/dataTests';
import { EscenariosPruebasAgregarEliminarPignoracion } from './utils/interfaces';
import { url_pignoracion_cuentas } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton Liberar monto
let botonDespignorar: Locator;

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

                // Boton para liberar un monto
                botonDespignorar = page.getByRole('row', {name: 'CONGELADO RD$ 150.00'}).locator(`${dataCheck}`);
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
        
                // // Balance
                // await expect(page.locator('#form_BALANCE')).toHaveValue('RD$ 2,073,700');
        
                // // Transito
                // await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue('RD$ 0');
        
                // // Pignorado
                // await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('RD$ 250');
        
                // // Disponible
                // await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue('RD$ 2,073,250');
        
                // Estado de Cuenta
                await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');
            });

            if (escenario.ID_OPERACION !== 29) {
                test('No debe permitir Despignorar un Monto', async () => {
                    // El boton de Liberar debe estar deshabilitado
                    await expect(botonDespignorar).toBeDisabled();
                });
            } else if (escenario.ID_OPERACION === 29) {
                test('Despignorar un monto', async () => {
                    // Liberar la pignoracion de 150 pesos
                    await expect(botonDespignorar).toBeEnabled();
                    await botonDespignorar.click();
            
                    // Debe salir un modal
                    await expect(page.locator('h1').filter({hasText: 'RAZÓN DE LIBERACIÓN'})).toBeVisible();
            
                    // Razon
                    await expect(page.getByText('RAZON DE DESPIGNORACION')).toBeVisible();
            
                    // Comentario
                    await page.locator('#form_DESC_RAZON_DESPIGNORACION').fill('Despignorar los 150 pesos pignorados anteriormente');

                    // Click al boton de Aceptar del modal
                    const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
                    await expect(botonAceptar).toBeEnabled();
                    await botonAceptar.click();
            
                    // Debe salir otro modal de confirmacion
                    await expect(page.getByText('¿Está seguro de liberar el registro?')).toBeVisible();
            
                    // Click en Aceptar
                    await page.getByRole('dialog').filter({ hasText: 'Confirmar¿Está seguro de liberar el registro?CancelarAceptar' }).getByRole('button', { name: 'check Aceptar' }).click();
            
                    // Los 150 pesos ya no deben mostrarse en la tabla despues de despignorarlos
                    await expect(page.getByRole('row', {name: 'CONGELADO RD$ 150.00'})).not.toBeVisible();
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

