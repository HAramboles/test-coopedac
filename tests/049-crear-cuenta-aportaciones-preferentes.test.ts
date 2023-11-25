import { APIResponse ,Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { ariaCerrar, selectBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearCuentas } from './utils/dataPages/interfaces';
import { url_base, url_cuentas_aportaciones_preferentes } from './utils/dataPages/urls';
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
test.describe.serial('Aportaciones Preferentes - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear una nueva page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    //Constante con el body
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
        
                // Ingresar a la pagina
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
        
            test('Ir a Apertura de Cuenta de Aportaciones', async () => {
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Captaciones
                await page.getByRole('menuitem', {name: 'Aportaciones Preferentes'}).first().click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_cuentas_aportaciones_preferentes}`);
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
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
                test('Boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
                });

                test('Crear cuenta de Aportaciones Preferentes - Paso 1 - Datos Generales', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones_preferentes}/create?step=1`);
            
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();
            
                    // El titulo de la seccion debe estar visible
                    await expect(page.locator('text=Datos Generales')).toBeVisible();
                
                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);
            
                    // Buscar un socio
                    await page.locator(`${selectBuscar}`).first().fill(`${cedula}`);

                    // Esperar a que el servicio de busqueda de personas cargue
                    await page.waitForResponse(`${servicio_busqueda_personas_crear}`);
                    await page.waitForTimeout(3000);

                    // Click al socio
                    await page.locator(`text=${cedula}`).click();
            
                    // Cambiar al descripcion de la cuenta
                    const descripcion = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
                    await descripcion.fill('Cuenta de Aportaciones Preferentes');
            
                    // La categoria debe ser de socio ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

                    // Monto disponible en aportaciones
                    await expect(page.getByText('Monto disponible en aportaciones es: 2,000.00')).toBeVisible();

                    // Ingresar un monto mayor al maximo de apertura
                    await expect(page.getByText('Monto máximo de apertura: 6,000.00')).toBeVisible();

                    // Ingresar un monto mayor al maximo de apertura
                    const montoApertura = page.locator('#APORTACIONES\\ REFERENTES_MONTO_APERTURA');
                    await montoApertura.fill('8,000');

                    // Click fuera del input
                    await page.getByTitle('Titular').click();

                    // Debe salir un modal de error
                    await expect(page.locator('text=El monto máximo de apertura es 6,000.00')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Ingresar un monto de apertura correcto
                    await montoApertura.clear();
                    await montoApertura.fill('1000');
                    // Click fuera del input
                    await page.getByTitle('Titular').click();

                    // Revisar que los rangos esten visibles
                    await page.locator('[aria-label="eye"]').click();
                    // Debe salir un modal
                    const modalRangos = page.getByRole('heading', {name: 'Detalles de Rango'}).first();
                    await expect(modalRangos).toBeVisible();

                    // Debe mostrarse la tabla de rangos
                    await expect(page.getByRole('columnheader', {name: 'Moneda'}).nth(1)).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'Monto'}).nth(1)).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'Tasa'}).nth(1)).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'Plazo'}).nth(1)).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'Mora'}).nth(1)).toBeVisible();

                    // Click en Aceptar para cerrar el modal de los rangos
                    await page.getByRole('button', {name: 'check Aceptar'}).nth(1).click();

                    // El modal no se debe mostrar
                    await expect(modalRangos).not.toBeVisible();

                    // Plazo
                    await page.getByPlaceholder('PLAZO').fill('24');

                    // El plazo debe ser mensual, que es el que viene por defecto
                    await expect(page.locator('text=MENSUAL')).toBeVisible();

                    // Tasa Anual
                    await page.locator('#APORTACIONES\\ REFERENTES_TASA').fill('8');
            
                    // La firma debe ser opcional, por lo que no se le agregara una firma a la cuenta
            
                    // El titulo de origen de inversion debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'ORIGEN DE INVERSIÓN'})).toBeVisible();
            
                    // Buscar una cuenta de la persona
                    const campoBuscarCuenta = page.locator(`${selectBuscar}`).last();
                    await campoBuscarCuenta.click();
                    // Elegir la cuenta de ahorros
                    await page.locator('text=AHORROS NORMALES').click();
            
                    // Boton Agregar la cuenta
                    const botonAgregar = page.getByRole('button', {name: 'plus Agregar'});
                    await expect(botonAgregar).toBeVisible();
                    // Click al boton 
                    await botonAgregar.click();
            
                    // El monto por defecto es el monto de apertura, clickear en otro lugar para que se guarde el monto
                    await page.locator('text=TOTALES').click();
            
                    // Click en continuar
                    const botonContinuar = page.locator('text=Continuar');
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
                });
            
                test('Crear cuenta de Aportaciones Preferentes - Paso 2 - Contacto de Firmante', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones_preferentes}/create?step=2`);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Cerrar uno de los mensajes que se muestran
                    await page.locator(`${ariaCerrar}`).last().click();

                    // Cambiar a la pestaña de Personas o Contactos
                    const seccionPersonaContactos = page.locator('text=Personas o Contactos');
                    await seccionPersonaContactos.click();
            
                    // Titulo de la seccion debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CONTACTOS CON LA PERSONAS O EMPRESA'})).toBeVisible();
            
                    // Regresar a la seccion de firmantes
                    await page.getByRole('tab').filter({hasText: 'Firmantes'}).click();
            
                    // Cerrar los mensajes que aparecen
                    await page.locator(`${ariaCerrar}`).first().click();
            
                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.getByRole('button', {name: 'plus Agregar Firmante'});
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
            
                test('Crear cuenta de Aportaciones Preferentes - Paso 3 - Metodo de Interes', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones_preferentes}/create?step=3`);
            
                    // El titulo debe estar visible
                    await expect(page.locator('text=FORMA PAGO DE INTERESES O EXCEDENTES')).toBeVisible();

                    // Debe mostrarse la cuenta que se esta creando, y el titular
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                });
            
                test('Finalizar con el registro de cuenta de aportaciones preferentes', async () => {
                    // Esperar que el mensaje de que los contratos se hayan generado se muestre
                    await expect(page.locator('text=Contratos Generados Exitosamente.')).toBeVisible();
                    
                    // Boton de Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
                  
                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
                    
                    // Debe de regresar a la pagina las cuentas de ahorros
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones_preferentes}`);
            
                    // El titulo de Ahorros debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
                });
            };
            
            test.afterAll(async () => { // Despues de las pruebas
                // Cerra la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});
