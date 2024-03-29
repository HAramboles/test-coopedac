import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { ariaCerrar, selectBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearCuentas } from './utils/dataPages/interfaces';
import { url_base, url_cuentas_ahorros, url_cuentas_ahorros_orden_pago } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { nombreTestigoCajero } from './utils/data/usuarios';
import { servicio_busqueda_personas_crear } from './utils/dataPages/servicios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Cuenta
let botonNuevaCuenta: Locator;

// Imagen de la firma
const firma = './tests/utils/img/firma.jpg';

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Cedula, nombre y apellido del firmante
let cedulaFirmante: string | null;
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Crear Cuenta de Ahorros - Orden de Pago - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                /* Crear el browser, con la propiedad headless */
                browser = await chromium.launch(browserConfig);
        
                /* Crear un context con el storageState donde esta guardado el token de la sesion */
                context = await browser.newContext(contextConfig);
        
                /* Crear una nueva page usando el context */
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[33]).length > 1) {
                        // Reemplazar el body con la response con los datos del escenario
                        body.data[33] = Object.assign(body.data[33], escenario);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body)
                        })
                    } else {
                        route.continue();
                    };
                });
        
                /* Ingresar a la pagina */
                await page.goto(`${url_base}`);

                // Boton de Crear Nueva Cuenta
                botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Cedula, nombre y apellido de la persona relacionada almacenada en el state
                cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
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

            if (escenario.ID_OPERACION !== 30) {
                // Test si el ID_OPERACION es diferente de 30
                test('No debe permitir Crear una Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();

                    // Debe salir un mensaje
                    const mensajeError = page.getByRole('dialog').getByText('No tiene permisos para crear cuentas');
                    await expect(mensajeError).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // El mensaje debe desaparecer
                    await expect(mensajeError).not.toBeVisible();
                });
            } else if (escenario.ID_OPERACION === 30) {
                // Tests si el ID_OPERACION es 30
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_orden_pago}/create?step=1`);
            
                    // El titulo de Registrar Cuenta debe estar visible
                    await expect(page.locator('text=CREAR CUENTA DE AHORROS')).toBeVisible();
                });
            
                test('Llenar los campos del primer paso del registro de cuenta de ahorros - orden de pago', async () => {
                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);

                    // Titular
                    const campoTitular = page.locator(`${selectBuscar}`);
                    // Buscar un socio
                    await campoTitular?.fill(`${cedula}`);

                    // Esperar a que el servicio de busqueda de personas cargue
                    await page.waitForResponse(`${servicio_busqueda_personas_crear}`);
                    await page.waitForTimeout(3000);
                    
                    // Seleccionar la opcion que aparece
                    await page.locator(`text=${cedula}`).click();
            
                    // El tipo de captacion debe ser Ahorros
                    await expect(page.locator('text=ORDEN DE PAGO').first()).toBeVisible();

                    // La categoria debe ser Socio Ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();
            
                    // Subir la imagen de la firma
                    const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
                    await page.getByText('Cargar ').click(); 
                    const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
                    await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo

                    // La firma subida debe estar visible
                    await expect(page.getByAltText('firma.jpg')).toBeVisible();
            
                    // Boton de  Continuar
                    const botonContinuar = page.getByRole('button', {name: 'Continuar'});
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();
                });
            
                test('Contacto de Firmante o Persona', async () => {              
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_orden_pago}/create?step=2`);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Cerrar uno de los mensajes que aparecen
                    await page.locator(`${ariaCerrar}`).first().click();

                    // El titular debe estar en la tabla de los firmantes
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Se debe mostrar la firma del titular por defecto
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El tipo de firma requerida debe estar visible
                    await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();
            
                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.locator('text=Agregar Firmante');
                    await expect(botonAgregarFirmantes).toBeVisible();
                    // Click al boton
                    await botonAgregarFirmantes.click();
            
                    // Agregar un firmante, debe salir un modal
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();
            
                    // Bucar un socio
                    const buscador = page.locator(`${selectBuscar}`);
                    await buscador.click();
                    await buscador.fill(`${cedulaFirmante}`);
                    // Seleccionar el socio
                    await expect(page.locator(`text=${nombreFirmante} ${apellidoFirmante}`)).toBeVisible();
                    await page.locator(`text=${nombreFirmante} ${apellidoFirmante}`).click();
            
                    // Debe salir otro modal para llenar la informacion de la firmante
                    await expect(page.locator('text=FIRMANTE:')).toBeVisible();
            
                    // Tipo firmante
                    await page.locator('#form_TIPO_FIRMANTE').click();
                    // Seleccionar un tipo de firmante
                    await page.locator('text=CO-PROPIETARIO').click();
            
                    // Tipo firma
                    await page.locator('#form_CONDICION').click();
                    // Seleccionar un tipo de firma
                    await page.locator('text=(O) FIRMA CONDICIONAL').click();
            
                    // Subir la imagen de la firma
                    const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
                    await page.getByText('Cargar ').click(); 
                    const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
                    await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo
            
                    // Esperar que la firma se suba y se muestre
                    await expect(page.locator('(//div[@class="ant-upload-list ant-upload-list-picture-card"])')).toBeVisible();
            
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Debe aparecer un modal para seleccionar el testigo de la eliminacion del firmante
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
            
                    // Boton de Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
            
                    // El firmante agregado se debe mostrar
                    await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();
            
                    // Boton de Guardar y Continuar
                    const botonGuardaryContinuar = page.getByRole('button', {name: 'Guardar y continuar'});
                    await expect(botonGuardaryContinuar).toBeVisible();
                    await botonGuardaryContinuar.click();
                });
            
                test('Metodo de intereses', async () => {
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_orden_pago}/create?step=3`);
                    
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta que se esta creando, y el titular
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                });
            
                test('Finalizar con el registro de cuenta de ahorro', async () => {
                    // Esperar que el mensaje de que los contratos se hayan generado se muestre
                    await expect(page.locator('text=Contratos Generados Exitosamente.')).toBeVisible();

                    // Boton de Finalizar
                    const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
                  
                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
                    
                    // Debe de regresar a la pagina las cuentas de ahorros
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_orden_pago}`);
            
                    // El titulo de Ahorros debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
                });

                test('Las opciones con los tipos de captacion deben estar visibles', async () => {
                    // Esperar que la pagina cargue
                    await page.waitForTimeout(3000);
                    
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
        
            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});

