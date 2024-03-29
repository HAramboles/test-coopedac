import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { formBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaEditarPersonas } from './utils/dataPages/interfaces';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Editar
let botonEditarCuenta: Locator;

// Cedula, nombre, apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Imprimir los Reportes de Admision y de Conozca a su Socio - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaEditarPersonas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
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
                    // Condicicion para cambiar los parametros del body
                    if (Object.keys(body?.data[10]).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data[10] = Object.assign(body.data[10], escenarios);
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

                // Cedula, nombre y apellido de la persona
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Boton de Editar Cuenta
                botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
            });
        
            test('Ir a la opcion de Registro de Persona', async () => {
                // Socios
                await page.getByRole('menuitem', {name: 'SOCIOS'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Registrar persona
                await page.getByRole('menuitem', {name: 'Registrar persona'}).click();
        
                // La URL deba cambiar
                await expect(page).toHaveURL(`${url_registro_persona}`);
            });
        
            test('Buscar la cuenta del socio', async () => { 
                // El titulo principal de la pagina debe esatr visible
                await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

                // Buscar al menor
                await page.locator(`${formBuscar}`).fill(`${cedula}`);
            });

            // Condicion para los diferentes parametros que pueden llegar en el ID_OPERACION
            if (escenarios.ID_OPERACION !== 4) {
                // Test cuando el ID_OPERACION sea diferente de 4
                test('El boton de Editar no debe estar visible', async () => {
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).not.toBeVisible();
                });
            } else if (escenarios.ID_OPERACION === 4) {
                // Tests cuando el ID_OPERACION sea igual a 4
                test('Ir a la opcion de Editar Persona', async () => {
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);

                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/edit/);
                });

                test('Ir a la ultima opcion - Relacionados del socio', async () => {
                    // El titulo de la primera seccion se debe cambiar
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();
            
                    // Seccion de direcciones y contactos
                    const relacionados = page.getByRole('button', {name: '6 Relacionados Agregar Relacionados'});
                    await expect(relacionados).toBeVisible();
                    await relacionados.click();
                });
            
                test('Imprimir Reporte de Admision', async () => {
                    // El titulo de relacionados del socio debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();
            
                    // Boton Reporte de Admision
                    const generarReporte = page.getByRole('button', {name: 'Admisión'});
                    await expect(generarReporte).toBeVisible();
                    await generarReporte.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
                });
            
                test('Imprimir Reporte de Conozca a su Socio', async () => {
                    // El titulo de relacionados del socio debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();
            
                    // Boton Reporte de Conozca a su Socio
                    const generarReporte = page.getByRole('button', {name: 'Conozca a su Socio'});
                    await expect(generarReporte).toBeVisible();
                    await generarReporte.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page1.close();
                });
            
                test('Regresar a la pagina de los socios', async () => {
                    // Boton Anterior
                    const botonAnterior = page.getByRole('button', {name: 'Anterior'});
                    await expect(botonAnterior).toBeVisible();
                    await botonAnterior.click();
            
                    // Debe ir a la seccion anterior
                    await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
            
                    // Boton Cancelar
                    const botonCancelar = page.getByRole('button', {name: 'Cancelar'});
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();
            
                    // Debe salir un modal de confirmacion
                    await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();
            
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // El titulo principal de la pagina debe esatr visible
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
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

