import { APIResponse, Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base, browserConfig, selectBuscar, contextConfig } from './utils/dataTests';
import { url_solicitud_credito } from './utils/urls';
import { EscenariosVerProcentajeCobros } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Botones
let botonNuevaSolicitud: Locator;
let botonCancelar: Locator

// Pruebas
test.describe.serial('Pruebas con el parametro de ver porcentaje de las cuentas de cobros', async () => {
    for (const escenarios of EscenariosVerProcentajeCobros) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
                
                // Crear el context
                context = await browser.newContext(contextConfig);

                // Crear una page
                page = await context.newPage();

                // Eventos para la request actividad_parametro
                await page.route(/\/actividad_parametro/, async (route) => {
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
                            body: JSON.stringify(body)
                        });
                    } else {
                        route.continue();
                    }
                });

                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Cedula, nombre y apellido de la persona almacendad en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Boton de Nueva Solicitud de Credito
                botonNuevaSolicitud = page.getByRole('button', {name: 'Nueva Solicitud'});
                // Boton de Cancelar
                botonCancelar = page.getByRole('button', {name: 'Cancelar'});
            });

            // Funcion con el boton de continuar, que se repite en cada seccion del registro
            const GuardaryContinuar = async () => {
                // continuar
                const botonGuardaryContinuar = page.locator('button:has-text("Guardar y continuar")');
                // Esperar a que este visible
                await expect(botonGuardaryContinuar).toBeVisible();
                // presionar el boton
                await botonGuardaryContinuar.click();
            };

            test('Ir a la opcion de Solicitud de Credito', async () => {
                // Negocios
                await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

                // Procesos
                await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

                // Solicitud de Credito
                await page.getByRole('menuitem', {name: 'Solicitud de Crédito'}).click();

                // La URL debe de cambiar
                await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

                // El titulo principal debe estar visible
                await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
            });

            if (escenarios.VER_PORC_COBRO === 'N') {
                test('La columna de porcentaje de las cuentas de cobros no debe visualizarse', async () => {
                    // Click al boton de nueva solicitud
                    await expect(botonNuevaSolicitud).toBeVisible();
                    await botonNuevaSolicitud.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=1`);

                    // Buscar al socio
                    await page.locator(`${selectBuscar}`).fill(`${cedula}`);
                    // Seleccionar al socio
                    await page.locator(`text=${nombre} ${apellido}`).click();

                    // El nombre de la persona debe estar visible
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

                    // Click al boton de guardar y continuar 
                    GuardaryContinuar();

                    // Se debe mostrar un modal
                    await expect(page.locator('text=No se ha actualizado la información laboral de la persona. ¿Desea continuar?')).toBeVisible();
                    
                    // Click en Aceptar
                    await page.locator('text=Aceptar').click();

                    // La URL no debe cambiar
                    await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=2`);

                    // Seccion Cuentas de Cobros
                    await expect(page.locator('text=Cuentas de cobro')).toBeVisible();
                    
                    // Agregar una cuenta de Cobro
                    await page.locator(`${selectBuscar}`).last().click();

                    // Seleccionar la cuenta de ahorros
                    await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

                    // Click al boton de Agregar Cuenta
                    const botonAgregarCuenta = page.getByRole('button', {name: 'Agregar cuenta'});
                    await expect(botonAgregarCuenta).toBeVisible();
                    await botonAgregarCuenta.click();

                    // Se deben agregar los datos a la tabla de las cuentas
                    await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // La columna de porcentaje no debe visualizarse
                    await expect(page.getByRole('columnheader', {name: '% Cobro'})).not.toBeVisible();

                    // Click al boton de Cancelar
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();

                    // Aparece un modal de confirmacion
                    await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

                    // Click al boton de Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Debe regresar a la pagina de las solicitudes solicitadas
                    await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);
                });

            } else if (escenarios.VER_PORC_COBRO === 'S') {
                test('La columna de porcentaje de las cuentas de cobros si debe visualizarse', async () => {
                    // Click al boton de nueva solicitud
                    await expect(botonNuevaSolicitud).toBeVisible();
                    await botonNuevaSolicitud.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=1`);

                    // Buscar al socio
                    await page.locator(`${selectBuscar}`).fill(`${cedula}`);
                    // Seleccionar al socio
                    await page.locator(`text=${nombre} ${apellido}`).click();

                    // El nombre de la persona debe estar visible
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

                    // Click al boton de guardar y continuar 
                    GuardaryContinuar();

                    // Se debe mostrar un modal
                    await expect(page.locator('text=No se ha actualizado la información laboral de la persona. ¿Desea continuar?')).toBeVisible();
                    
                    // Click en Aceptar
                    await page.locator('text=Aceptar').click();

                    // La URL no debe cambiar
                    await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=2`);

                    // Seccion Cuentas de Cobros
                    await expect(page.locator('text=Cuentas de cobro')).toBeVisible();
                    
                    // Agregar una cuenta de Cobro
                    await page.locator(`${selectBuscar}`).last().click();

                    // Seleccionar la cuenta de ahorros
                    await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

                    // Click al boton de Agregar Cuenta
                    const botonAgregarCuenta = page.getByRole('button', {name: 'Agregar cuenta'});
                    await expect(botonAgregarCuenta).toBeVisible();
                    await botonAgregarCuenta.click();

                    // Click a al input de porcentaje cobro y luego click fuera del input
                    await page.locator('#PORC_COBRO').click();
                    await page.getByRole('heading', {name: 'Generales del Crédito'}).click();

                    // Se deben agregar los datos a la tabla de las cuentas
                    await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // La columna de porcentaje debe visualizarse
                    await expect(page.getByRole('columnheader', {name: '% Cobro'})).toBeVisible();

                    // Click al boton de Cancelar
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();

                    // Aparece un modal de confirmacion
                    await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

                    // Click al boton de Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Debe regresar a la pagina de las solicitudes solicitadas
                    await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);
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