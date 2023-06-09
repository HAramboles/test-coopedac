import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, EditarPersonas, formBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre, apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Parametros de Relation
const EscenariosPrueba: EditarPersonas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 8
    },
    {
        ID_OPERACION: 4
    }
];

// Pruebas

test.describe('Imprimir los Reportes de Admision y de Conozca a su Socio - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: false
                });
        
                // Crear el context
                context =  await browser.newContext({
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
                cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            });
        
            test('Ir a la opcion de Registro de Persona', async () => {
                test.slow();
                
                // Socios
                await page.getByRole('menuitem', {name: 'SOCIOS'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Registrar persona
                await page.getByRole('menuitem', {name: 'Registrar persona'}).click();
        
                // La URL deba cambiar
                await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);
            });
        
            test('Buscar la cuenta del socio', async () => {   
                test.slow();

                // El titulo principal de la pagina debe esatr visible
                await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

                // Buscar al menor
                await page.locator(`${formBuscar}`).fill(`${cedula}`);
            });

            // Condicion para los diferentes parametros que pueden llegar en el ID_OPERACION
            if (escenarios.ID_OPERACION == '') {
                // Test cuando el ID_OPERACION sea Vacio
                test('El boton de Editar no debe estar visible', async () => {
                    // Click al boton de editar cuenta
                    const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                    await expect(botonEditarCuenta).not.toBeVisible();

                    // Skip al test
                    test.skip();
                });
            } else if (escenarios.ID_OPERACION === 8) {
                // Test cuando el ID_OPERACION sea diferente de 4
                test('El boton de Editar no debe estar visible', async () => {
                    // Click al boton de editar cuenta
                    const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                    await expect(botonEditarCuenta).not.toBeVisible();

                    // Skip al test
                    test.skip();
                });
            } else if (escenarios.ID_OPERACION === 4) {
                // Tests cuando el ID_OPERACION sea igual a 4
                test('Ir a la opcion de Editar Persona', async () => {
                    test.slow();
                    
                    // Click al boton de editar cuenta
                    const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

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
                    await expect(page.locator('h1').filter({ hasText: 'RELACIONADOS DEL SOCIO' })).toBeVisible();
            
                    // Boton Reporte de Admision
                    const generarReporte = page.getByRole('button', {name: 'Admisión'});
                    // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(generarReporte).toBeVisible(),
                        await generarReporte.click()
                    ]);
            
                    // Cerrar la pagina con el reporte
                    await newPage.close();
                });
            
                test('Imprimir Reporte de Conozca a su Socio', async () => {
                    // El titulo de relacionados del socio debe estar visible
                    await expect(page.locator('h1').filter({ hasText: 'RELACIONADOS DEL SOCIO' })).toBeVisible();
            
                    // Boton Reporte de Conozca a su Socio
                    const generarReporte = page.getByRole('button', {name: 'Conozca a su Socio'});
                    // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(generarReporte).toBeVisible(),
                        await generarReporte.click()
                    ]);
            
                    // Cerrar la pagina con el reporte
                    await newPage.close();
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
            });
        });
    };
});

