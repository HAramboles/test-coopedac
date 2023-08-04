import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, formBuscar } from './utils/dataTests';
import { EscenariosCambioEstadoPersonas } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Selecor de la categoria
let selectorEstado: Locator;

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
                    headless: false,
                    args: ['--window-position=-1300,100'],
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
                    if (Object.keys(body?.data[29]).length > 1) {
                        // Reemplazar el body con la response con los datos del escenario
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
                selectorEstado = page.locator('#person_ID_ESTADO');

                // Cedula, nombre y apellido de la persona
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaCasada'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaCasada'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaCasada'));
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

                // Buscar a la persona casada
                await page.locator(`${formBuscar}`).fill(`${apellido}`);

                // Click al boton de editar 
                await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();
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
                test('No debe permitir poder cambiar el Estado', async () => {
                    await expect(selectorEstado).toBeDisabled();
                });
            } else if (escenarios.ID_OPERACION === 25) {
                // Tests cuando ID_OPERACION es igual a 25
                test('Cambiar de estado Activo a Inactivo', async () => {
                    // El estado de la persona debe ser Activo
                    await expect(page.getByTitle('ACTIVO')).toBeVisible();

                    // Click al selector de estado
                    await expect(selectorEstado).toBeVisible();
                    await selectorEstado.click();

                    // Deben salir los diferentes estados a elegir
                    await expect(page.getByRole('option', {name: 'ACTIVO'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'FALLECIDO'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'INCOMPLETO'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'RETIRADO'})).toBeVisible();
                    const estadoInactivo = page.getByRole('option', {name: 'INACTIVO'});
                    await expect(estadoInactivo).toBeVisible();

                    // Click a la opcion de estado Inactivo
                    await estadoInactivo.click();
                    
                    // El estado de la persona debe ser Inactivo
                    await expect(page.getByTitle('INACTIVO')).toBeVisible();

                    // Click al boton de Actualizar y continuar
                    const botonActualizar = page.locator('button').filter({hasText: 'Actualizar y continuar'});
                    await expect(botonActualizar).toBeVisible();
                    await botonActualizar.click();
                });

                test('Volver a la pagina del Registro de Personas', async () => {
                    // La url debe cambiar
                    await expect(page).toHaveURL(/\/?step=2/);

                    // Titulo del segundo paso
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();

                    // Click al boton de Cancelar
                    const botonCancelar = page.locator('button').filter({hasText: 'Cancelar'});
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();

                    // Debe salir un modal
                    await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

                    // Click al boton de Aceptar del modal
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Debe regresar a la pagina del Registro de Personas, el titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
                });

                test('Buscar a la Persona en el Estado Inactivo', async () => {
                    // Buscar a la persona casada
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);

                    // No deberia aparecer la persona
                    await expect(page.locator('text=No hay datos')).toBeVisible();

                    // Click al selector del filtro de estado
                    await page.getByRole('combobox').click();

                    // Deben salir los diferentes estados a elegir
                    await expect(page.getByRole('option', {name: 'ACTIVO'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'FALLECIDO'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'INCOMPLETO'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'RETIRADO'})).toBeVisible();
                    const estadoInactivo = page.getByRole('option', {name: 'INACTIVO'});
                    await expect(estadoInactivo).toBeVisible();

                    // Click a la opcion de estado Inactivo
                    await estadoInactivo.click();

                    // Deberia mostrarse la persona buscada
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
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
