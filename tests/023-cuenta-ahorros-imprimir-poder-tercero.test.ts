import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { dataPrinter, formBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaEditarCuentas } from './utils/dataPages/interfaces';
import { url_base, url_cuentas_ahorros, url_cuentas_ahorros_normales } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { nombreTestigoCajero } from './utils/data/usuarios';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Editar
let botonEditarCuenta: Locator;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Nombre y apellido del firmante
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Reporte Poder a Terceros - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaEditarCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear la page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[34]).length > 1) { 
                        // Reemplazar el body con la response con los datos de los escenario
                        body.data[34] = Object.assign(body.data[34], escenario);
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

                // Nombre y apellido de la persona relacionada almacenada en el state
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

                // Boton de Editar Cuentas
                botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
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

                // Click a la opcion de Ahorros Normales
                const opcionAhorrosNormales = page.locator('text=AHORROS NORMALES');
                await expect(opcionAhorrosNormales).toBeVisible();
                await opcionAhorrosNormales.click();
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}`);

                // El tipo de captacion de ahorros normales debe estar visible
                await expect(page.locator('#form').getByTitle('AHORROS NORMALES')).toBeVisible();
            });

            if (escenario.ID_OPERACION !== 31) {
                // Test si el ID_OPERACION es diferente de 31
                test('No debe permitir Editar la cuenta de ahorros', async () => {            
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // Debe mostrarse un mensaje
                    const mensajeError = page.getByRole('dialog').getByText('No tiene permisos para editar cuentas.')
                    await expect(mensajeError).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // El mensaje debe desaparecer
                    await expect(mensajeError).not.toBeVisible();
                });
            } else if (escenario.ID_OPERACION === 31) {
                // Tests cuando el ID_OPERACION es 31
                test('Datos Generales de la Cuenta de Ahorros', async () => {
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=1/);

                    // Esperar a que el servicio de busqueda de personas cargue
                    await page.waitForResponse('**/persona/personas?page=1&size=15');
                    await page.waitForTimeout(3000);
            
                    // El titulo de editar cuenta debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();

                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);
            
                    // Debe de aparecer el nombre de la persona como titulo
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();
            
                    // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
                    await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();
            
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
            
                test('Cuenta de Ahorros - Contacto de Firmante o Persona - Ver Reporte Poder a Terceros', async () => {            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=2/);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Por lo menos debe estar la firma del titular
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El boton de Agregar Firmante debe estar visible
                    const AgregarFirmante = page.locator('text=Agregar Firmante');
                    await expect(AgregarFirmante).toBeVisible();
            
                    // Boton de imprimir reporte
                    await page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`}).locator(`${dataPrinter}`).click();
            
                    // Debe salir un modal con la opcion de seleccionar un testigo
                    await expect(page.getByText('Seleccionar Testigo', {exact: true})).toBeVisible();
            
                    // Seleccionar un testigo
                    const seleccionarTestigo = page.locator('#form_ID_TESTIGO');
                    await expect(seleccionarTestigo).toBeVisible();
                    await seleccionarTestigo.click();

                    // Seleccionar un testigo, la primera opcion que aparezca
                    await expect(page.getByRole('option', {name: `${nombreTestigoCajero}`})).toBeVisible();
                    await page.getByRole('option', {name: `${nombreTestigoCajero}`}).click();

                    // Esperar dos segundos antes de dar click al boton de Aceptar
                    await page.waitForTimeout(2000);
            
                    // Boton de Imprimir
                    const botonImprimir = page.getByRole('button', {name: 'check Imprimir'});
                    await expect(botonImprimir).toBeVisible();
                    await botonImprimir.click();
            
                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
            
                    // Confirmar que se regreso a la pagina anterior
                    await expect(page).toHaveURL(/\/?step=2/);
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Confirmar que el nombre del firmante este visible
                    await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();
            
                    // Click al boton de Cancelar
                    const botonCancelar = page.locator('[id="AHORROS\ NORMALES"]').getByRole('button', {name: 'stop Cancelar'});
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();
            
                    // Click en Aceptar
                    const botonAceptar = page.locator('text=Aceptar');
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();
            
                    // Debe regresar al listado de las cuentas
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}`);
                });

                test('Las opciones con los tipos de captacion deben estar visibles', async () => {
                    // Click al selector de tipos captacion
                    await expect(page.locator('#form').getByTitle('AHORROS NORMALES')).toBeVisible();
                    await page.locator('#form').getByTitle('AHORROS NORMALES').click();

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
