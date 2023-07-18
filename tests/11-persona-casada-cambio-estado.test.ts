import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, formBuscar } from './utils/dataTests';
import { EscenariosCambioEstadoPersonas } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Selecor de la categoria
let selectorCategoria: Locator;

// Cedula, nombre, apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Cambio de Estado de la Persona Casada - Pruebas con los diferentes Parametros', async () => {
    for (const escenarios of EscenariosCambioEstadoPersonas) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
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
                    if (Object.keys(body?.data[29]).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data[29] = Object.assign(body.data[29], escenarios);
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

                // Boton de Editar Cuenta
                selectorCategoria = page.locator('#person_ID_ESTADO');

                // Cedula, nombre y apellido de la persona
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            });
        
            test('Ir a la opcion de Registro de Persona', async () => {
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
                // El titulo principal de la pagina debe esatr visible
                await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

                // Buscar al menor
                await page.locator(`${formBuscar}`).fill(`${cedula}`);
            });

            test('Primer Paso - Datos Generales', async () => {
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                // El nombre debe estar visible
                await expect(page.locator('#person_NOMBRES')).toHaveValue(`${nombre}`);

                // El apellido debe estar visible
                await expect(page.locator('#person_APELLIDOS')).toHaveValue(`${apellido}`);
            });

            if (escenarios.ID_OPERACION !== 25) {
                // Test cuando ID_OPERACION es diferente de 25

            } else if (escenarios.ID_OPERACION === 25) {
                // Tests cuando ID_OPERACION es igual a 25
                
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
