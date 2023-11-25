import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { formBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaRemoverFirmantes } from './utils/dataPages/interfaces';
import { url_base, url_cuentas_ahorros, url_cuentas_ahorros_orden_pago } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { nombreTestigoCajero } from './utils/data/usuarios';
import { servicio_busqueda_personas_editar } from './utils/dataPages/servicios';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton eliminar firmante
let botonEliminarFirmante: Locator;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Cedula, nombre y apellido del firmante
let cedulaFirmante: string | null;
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Remover un Firmante de la cuenta de Orden de Pago - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaRemoverFirmantes) {
        test.describe(`Tests cuando el pamaetro es: ${Object.values(escenarios).toString()}`, async () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear la page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[31]).length > 1) { 
                        // Reemplazar el body con la response con los datos de los escenario
                        body.data[31] = Object.assign(body.data[31], escenarios);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        })
                    } else {
                        route.continue();
                    };
                });
        
                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Cedula, nombres y apellidos de la cuenta de la persona a editar
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Cedula, nombre y apellido del firmante
                cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

                botonEliminarFirmante = page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`}).locator('[aria-label="delete"]');
            });

            test('Ir a la opcion de Apertura de cuentas de Ahorros', async () => {
                // Boton de Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Boton de Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Boton de Ahorros
                await page.getByRole('menuitem', {name: 'Ahorros'}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_cuentas_ahorros}`);
        
                // El titulo de ahorros debe estar visible
                await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
            });
        
            test('Seleccionar un tipo de captaciones', async () => {
                // El titulo de tipo de captaciones debe estar visible
                await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();
        
                // Boton de seleccionar captaciones
                const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
                await expect(botonCaptaciones).toBeVisible();
                // Click al boton
                await botonCaptaciones.click();

                // Click a la opcion de Orden de Pago
                const opcionOrdenPago = page.locator('text=ORDEN DE PAGO');
                await expect(opcionOrdenPago).toBeVisible();
                await opcionOrdenPago.click();
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_cuentas_ahorros_orden_pago}`);

                // El tipo de captacion de ahorros normales debe estar visible
                await expect(page.locator('#form').getByTitle('ORDEN DE PAGO')).toBeVisible();
            });

            test('Buscar la Cuenta del Socio', async () => {
                // Buscar al socio a editar
                await page.locator(`${formBuscar}`).fill(`${cedula}`);

                // Debe mostrarse la cuenta del socio buscado
                await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
        
                // Click al boton de editar cuenta
                const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                await expect(botonEditarCuenta).toBeVisible();
                await botonEditarCuenta.click();
                
                // La URL debe cambiar
                await expect(page).toHaveURL(/\/?step=1/);

                // Esperar a que el servicio de busqueda de personas cargue
                await page.waitForResponse(`${servicio_busqueda_personas_editar}`);
                await page.waitForTimeout(3000);
        
                // El titulo de editar cuenta debe estar visible
                await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();
            });

            test('Primer Paso - Datos Generales', async () => {
                // Esperar que carguen los datos
                await page.waitForTimeout(4000);

                // Debe de aparecer el nombre de la persona como titulo
                await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

                // La categoria debe ser Socio Ahorrante
                await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

                // El componente de firma debe estar visible y debe ser unico
                const componenteFirma = page.locator('(//div[@class="ant-upload-list-item-container"])');
                // Boton Omitir
                const botonOmitir = page.getByRole('button', {name: 'Omitir'});
                if (await componenteFirma.isHidden()) {
                    // Ir al paso 2
                    const botonPaso2 = page.getByRole('button', {name: 'Firmantes y Contactos'});
                    await expect(botonPaso2).toBeVisible();
                    await botonPaso2.click();

                    // Esperar a que cargue la pagina
                    await page.waitForTimeout(2000);

                    // Volver al paso 1
                    const botonPaso1 = page.getByRole('button', {name: 'Datos generales'});
                    await expect(botonPaso1).toBeVisible();
                    await botonPaso1.click();

                    // La firma debe estar visible
                    await expect(componenteFirma).toBeVisible();

                    // Click en el boton de Omitir
                    await expect(botonOmitir).toBeVisible();
                    await botonOmitir.click();
                } else if (await componenteFirma.isVisible()) {
                    // Click al boton de Omitir
                    await expect(botonOmitir).toBeVisible();
                    await botonOmitir.click();
                };
            });

            test('Segundo Paso - Firmantes', async () => {
                // La URL debe cambiar
                await expect(page).toHaveURL(/\/?step=2/);

                // El titulo de firmantes debe estar visible
                await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

                // Firmante Titular de la cuenta
                await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                await expect(page.getByText('TITULAR')).toBeVisible();
                await expect(page.getByText('(Y) FIRMA REQUERIDA')).toBeVisible();

                // Firmante Co-propetario de la cuenta
                await expect(page.getByRole('cell', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();
                await expect(page.getByText('CO-PROPIETARIO')).toBeVisible();
                await expect(page.getByText('(O) FIRMA CONDICIONAL')).toBeVisible();
            });

            if (escenarios.ID_OPERACION !== 28) {
                // Test cuando ID_OPERACION es diferente de 28
                test('El boton de Eliminar Firmante debe estar inhabilitado', async () => {
                    // Boton de Remove Firmante inhabilitado
                    await expect(botonEliminarFirmante).toBeDisabled();

                    // Esperar cuatro segundos
                    await page.waitForTimeout(4000);
                });
            } else if (escenarios.ID_OPERACION === 28) {
                // Tests cuando ID_OPERACION es igual a 28
                test('El boton de Eliminar Firmante debe estar habilitado', async () => {
                    // Boton de Remove Firmante inhabilitado
                    await expect(botonEliminarFirmante).toBeEnabled();

                    // Esperar cuatro segundos
                    await page.waitForTimeout(4000);
                });

                test('Eliminar el firmante', async () => {
                    // Click al boton de eliminar firmante
                    await botonEliminarFirmante.click();

                    // Debe salir un mensaje para confirmar la eliminacion del firmante
                    await expect(page.locator('text=¿Está seguro de eliminar el registro?')).toBeVisible();

                    // Click al boton de Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Debe salir un modal con la opcion de seleccionar un testigo
                    await expect(page.getByText('Seleccionar Testigo', {exact: true})).toBeVisible();
            
                    // Seleccionar un testigo
                    const seleccionarTestigo = page.locator('#form_ID_TESTIGO');
                    await expect(seleccionarTestigo).toBeVisible();
                    await page.waitForTimeout(3000);
                    await seleccionarTestigo.click();

                    // Seleccionar un testigo, la primera opcion que aparezca
                    await expect(page.getByRole('option', {name: `${nombreTestigoCajero}`})).toBeVisible();
                    await page.getByRole('option', {name: `${nombreTestigoCajero}`}).click();

                    // Esperar dos segundos antes de dar click al boton de Aceptar
                    await page.waitForTimeout(2000)
            
                    // Boton de Imprimir
                    const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
                    await expect(botonImprimir).toBeVisible();
                    await botonImprimir.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
            
                    // Confirmar que se regreso a la pagina anterior
                    await expect(page).toHaveURL(/\/?step=2/);
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

                    // El firmante debe desaparecer de la lista
                    await expect(page.getByRole('cell', {name: `${nombreFirmante} ${apellidoFirmante}`})).not.toBeVisible();

                    // Boton de Guardar y Continuar
                    const botonGuardaryContinuar = page.getByRole('button', {name: 'Guardar y continuar'});
                    await expect(botonGuardaryContinuar).toBeVisible();
                    await botonGuardaryContinuar.click();
                });

                test('Tercer Paso - Metodo de Intereses', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=3/);
            
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta donde se va a depositar 
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                });

                test('Finalizar con la Edicion de la Cuenta de Orden de Pago', async () => {
                    // Boton Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")')
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
            
                    // Debe regresar a la pagina de inicio de las Cuentas de Ahorros
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_orden_pago}`);
                });

                test('Las opciones con los tipos de captacion deben estar visibles', async () => {
                    // Click al selector de tipos captacion
                    await expect(page.locator('#form').getByTitle('ORDEN DE PAGO')).toBeVisible();
                    await page.locator('#form').getByTitle('ORDEN DE PAGO').click();

                    // Todos los tipos de captacion deben estar visibles
                    await expect(page.getByRole('option', {name: 'AHORROS NORMALES'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'AHORROS POR NOMINA'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'AHORROS INFANTILES'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'ORDEN DE PAGO'})).toBeVisible();
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
