import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { selectBuscar, } from './utils/data/inputsButtons';
import { EscenariosPruebasCajaBoveda } from './utils/dataPages/interfaces';
import { url_base, url_transacciones_caja } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pruebas con Transacciones de Caja - Retiro - Cuenta de Ahorros Normales', async () => {
    for (const escenarios of EscenariosPruebasCajaBoveda) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, async () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear una nueva page
                page = await context.newPage();
        
                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Eventos para la request actividad_parameto
                await page.route(/\/actividad_parametro/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data = Object.assign(body.data, escenarios);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        });
                    } else {
                        route.continue();
                    };
                });
        
                // Cedula de la persona alamcenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
            });
        
            test('Ir a la opcion de Transacciones de Caja', async () => {
                // Tesoreria
                await page.getByRole('menuitem', {name: 'TESORERIA'}).click();
        
                // Cajas
                await page.getByRole('menuitem', {name: 'CAJAS'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Transacciones de caja
                await page.getByRole('menuitem', {name: 'Transacciones de Caja'}).click();
        
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_transacciones_caja}`);
            });

            if (escenarios.ES_BOVEDA !== '0') {
                // Test cuando el ES_BOVEDA sea diferente de 0
                test('Debe mostrarse un Modal informando que no puede hacer Transacciones', async () => {
                    // Titulo del modal
                    await expect(page.locator('text=Advertencia')).toBeVisible();

                    // Contenido del modal
                    await expect(page.locator('text=No tiene un turno aperturado o este tipo de caja no permite realizar transacciones de este tipo.')).toBeVisible();

                    // Botones del modal
                    await expect(page.getByRole('button', {name: 'Permanecer en la pagina'})).toBeVisible();
                    const botonInicio = page.getByRole('button', {name: 'Ir a Inicio'});
                    await expect(botonInicio).toBeVisible();

                    // Volver a la pagina de Inicio
                    await botonInicio.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}`);
                });
            } else if (escenarios.ES_BOVEDA === '0') {
                // Tests cuando el ES_BOVEDA sea igual a 0
                test('Transacciones de Caja - Retiro', async () => {        
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();
            
                    // Titulo Captaciones
                    await expect(page.locator('h1').filter({hasText: 'CAPTACIONES'})).toBeVisible();
            
                    // Titulo Colocaciones  
                    await expect(page.locator('h1').filter({hasText: 'COLOCACIONES'})).toBeVisible();
            
                    // Ingresos en Transito
                    await expect(page.locator('h1').filter({hasText: 'INGRESOS EN TRÁNSITO'})).toBeVisible();
            
                    // Egresos en Transito
                    await expect(page.locator('h1').filter({hasText: 'EGRESOS EN TRÁNSITO'})).toBeVisible(); 
                });
                
                test('Seleccionar una cuenta cancelada de un socio', async () => { 
                    // Click a la opcion de cuentas canceladas
                    await page.getByLabel('Cancelados').click();

                    // Input para buscar el socio
                    const buscarSocio = page.locator(`${selectBuscar}`);
                    await expect(buscarSocio).toBeVisible();
            
                    // Ingresar la cedula del socio
                    // await buscarSocio.fill(`${cedula}`);
                    await buscarSocio.fill('RUBY CORONADO');
                    // Seleccionar la cuenta de ahorros normales del socio
                    await page.locator('text=ORDEN DE PAGO').click();
                });
            
                test('Debe salir un mensaje de aviso', async () => {  
                    // Esperar que este el modal de aviso visible
                    await page.waitForTimeout(3000);
                    
                    // Titulo del modal
                    await expect(page.getByText('Cuenta Cancelada')).toBeVisible();
            
                    // Mensajde del modal de aviso
                    await expect(page.getByText('La cuenta seleccionada está CANCELADA, no se pueden realizar transacciones.')).toBeVisible();
            
                    // Cerrar el modal de aviso
                    await page.getByRole('button', {name: 'Aceptar'}).click();  
                });
            };

            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la pagina
                await page.close();
        
                // Cerrar el context
                await context.close();
            });
        });
    };
});
