import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { ariaCerrar, selectBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearCuentas } from './utils/dataPages/interfaces';
import { url_base, url_cuentas_aportaciones_crediautos } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { nombreTestigoCajero } from './utils/data/usuarios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Cuenta
let botonNuevaCuenta: Locator;

// Cedula y nombre de la persona juridica
let cedulaEmpresa: string | null;
let nombreEmpresa: string | null;

// Nombre y apellido del firmante
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Imagen de la firma
const firma = './tests/utils/img/firma.jpg';

// Pruebas
test.describe.serial('Creacion de Cuenta de Aportaciones Crediautos - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser, con la propiedad headless
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear una nueva page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
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

                // Boton de Crear Nueva Cuenta
                botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
                nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));

                // Cedula, nombre y apellido de la persona relacionada almacenada en el state
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
            });
        
            test('Ir a Apertura de Cuenta de Aportaciones Creiautos', async () => {
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Captaciones
                await page.getByRole('menuitem', {name: 'Aportaciones (CREDIAUTOS)'}).click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_cuentas_aportaciones_crediautos}`);
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES (CREDIAUTOS)'})).toBeVisible();
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
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones_crediautos}/create?step=1`);
                });
            
                test('Registrar Cuenta de Aportaciones - Datos Generales', async () => {
                    // El titulo de registrar cuenta deb estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();
            
                    // Ingresar el titular
                    const campoTitular = page.locator(`${selectBuscar}`);
                    await campoTitular?.fill(`${cedulaEmpresa}`);
                    // Click a la opcion que coincide con lo buscado
                    await page.locator(`text=${cedulaEmpresa}`).click();
            
                    // El nombre de la persona juridica deben aparecer como un titulo
                    await expect(page.locator('h1').filter({hasText: `${nombreEmpresa}`})).toBeVisible();
            
                    // El tipo de captacion debe ser Aportaciones
                    await expect(page.locator('#APORTACIONES_ID_TIPO_CAPTACION').nth(1)).toBeVisible();
            
                    // La Categoria debe ser Socio Ahorrante por defecto
                    await expect(page.getByText('SOCIO AHORRANTE')).toBeVisible();
            
                    // Boton de Continuar
                    const botonContinuar = page.getByRole('button', {name: 'Continuar'});
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();
                });
            
                test('Registrar Cuenta de Aportaciones - Contacto de Firmante o Persona', async () => {
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

                    // Cerrar dos de los mensajes
                    await page.locator(`${ariaCerrar}`).first().click();
                    await page.locator(`${ariaCerrar}`).last().click();
            
                    // Se debe mostrar la fima del titular por defecto
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El tipo de firma requerida debe estar visible
                    await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();

                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.getByRole('button', {name: 'plus Agregar Firmante'});
                    await expect(botonAgregarFirmantes).toBeVisible();
                    // Click al boton
                    await botonAgregarFirmantes.click();
            
                    // Agregar un firmante, debe salir un modal
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();
            
                    // El representante de la empresa debe estar visible sin tener que buscarlo
                    await expect(page.locator(`text=${nombreFirmante} ${apellidoFirmante}`)).toBeVisible();
            
                    // Seleccionar el firmante
                    await page.getByRole('button', {name: 'Seleccionar'}).click();
            
                    // Debe salir otro modal para llenar la informacion de la firmante
                    await expect(page.locator('text=FIRMANTE:')).toBeVisible();
            
                    // Tipo firmante
                    await page.locator('#form_TIPO_FIRMANTE').click();
                    // Seleccionar un tipo de firmante
                    await page.getByRole('option', {name: 'REPRESENTANTE'}).click();
            
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
            
                test('Registrar Cuenta de Aportaciones - Método de intereses', async () => {
                    // El titulo de  debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta que se esta creando, y el titular
                    await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();
                });
            
                test('Finalizar con el Registro de la Cuenta de Aportaciones', async () => {
                    // Boton de finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
            
                    // Debe redirigirse al listado de las cuentas de aportaciones
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones_crediautos}`);
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

