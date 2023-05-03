import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

/* URL de la pagina */
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Variable con la cedula de la persona
let cedula: string | null;

// Parametros de relation
interface AportacionesExistentesParametros {
    ID_OPERACION: '' | 5 | 30
}

const EscenariosPrueba: AportacionesExistentesParametros[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 5
    },
    {
        ID_OPERACION: 30
    }
];

// Pruebas

test.describe('No permitir Crear una Nueva Cuenta de Aportaciones al mismo Socio - Pruebas con los diferentes parametros', () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
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

                // Cedula de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
            });
        
            test('Ir a Apertura de cuenta de aportaciones', async () => {
                // Captaciones
                await page.locator('text=CAPTACIONES').click();
        
                // Apertura de cuentas
                await page.locator('text=APERTURA DE CUENTAS').click();
        
                // Captaciones
                await page.locator('text=Aportaciones').first().click();
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();
                        
                // Condicion por si el tipo de captacion llega sin datos o con datos
                const tipoCaptacion = page.getByTitle('APORTACIONES', {exact: true});
        
                if (await tipoCaptacion.isHidden()) {
                    // Si no llega el tipo de captacion, manualmente dirigise a la url de las aportacciones
                    await page.goto(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
                } else if (await tipoCaptacion.isVisible()) {
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
                }
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
            } else if (escenario.ID_OPERACION === 5) {
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
                // Tests si el ID_OPERACION es 30
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1/create?step=1`);
                });
            
                test('Debe de salir un modal avisando que el titular ya tiene una cuenta de aportaciones', async () => {            
                    // El titulo de registrar cuenta deb estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();
            
                    // Ingresar el titular
                    const campoTitular = page.locator('#select-search');
            
                    await campoTitular?.fill(`${cedula}`);
                    // Click a la opcion que coincide con lo buscado
                    await page.locator(`text=${cedula}`).click();
            
                    // El modal debe de salir, luego de ingresar el titular
                    const modal = page.locator('text=Este cliente ya posee una cuenta de este tipo captación.');
                    await expect(modal).toBeVisible();
            
                    // Aceptar y regresar a la pagina de aportaciones
                    const botonAceptar = page.locator('text=Aceptar');
                    await botonAceptar.click();
            
                    // El modal debe desaparecer
                    await expect(modal).not.toBeVisible();
            
                    // Debe regresar atras y la URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
                });
            }
        
            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la page
                await page.close();
        
                // Cerrar el context
                await context.close();
            });
        });
    }
})

