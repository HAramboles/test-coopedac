import { APIResponse, Browser, BrowserContext, chromium, Page, expect, Locator, test } from '@playwright/test';
import { ariaCerrar, selectBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearCuentas } from './utils/dataPages/interfaces';
import { url_base, url_cuentas_certificados, url_cuentas_certificados_financieros_reinvertidas } from './utils/dataPages/urls';
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

// Cedula y nombre de la empresa
let cedulaEmpresa: string | null;
let nombreEmpresa: string | null;

// Cedula, nombre y apellido del firmante
let cedulaFirmante: string | null;
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Certificados - Financieros Reinvertidas - Pruebas con los diferentes parametros', async () => {
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
        
                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Boton de Crear Nueva Cuenta
                botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});

                // Cedula y nombre de la persona juridica almacenada en el state
                cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
                nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));

                // Cedula, nombre y apellido de la persona relacionada almacenada en el state
                cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
            });
        
            test('Ir a la opcion de Apertura de cuentas de Certificados', async () => {
                // Boton de Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Boton de Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Boton de Certificados
                await page.getByRole('menuitem', {name: 'Certificados', exact: true}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_cuentas_certificados}`);
        
                // El titulo de Certificadoss debe estar visible
                await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();
            });
        
            test('Seleccionar el Certificado Financieros Reinvertidas', async () => {
                // El titulo de tipo de captaciones debe estar visible
                await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();
        
                // Boton de seleccionar captaciones
                const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
                await expect(botonCaptaciones).toBeVisible();
                // Click al boton
                await botonCaptaciones.click();

                // Click a la opcion de Financieros Reinvertidas
                const opcionFinancierosReinvertidas = page.locator('text=FINANCIEROS REINVERTIDAS');
                await expect(opcionFinancierosReinvertidas).toBeVisible();
                await opcionFinancierosReinvertidas.click();
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_reinvertidas}`);

                // El tipo de captacion de Financieros Reinvertidas debe estar visible
                await expect(page.locator('#form').getByTitle('FINANCIEROS REINVERTIDAS')).toBeVisible();
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
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
                });

                test('Crear una Nueva Cuenta de Certificado - Paso 1 - Datos Generales - Agregar una cuenta sin colocar un monto', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE CERTIFICADOS'})).toBeVisible();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_reinvertidas}/create?step=1`);
            
                    // La cuenta debe ser de financieros reinvertidas
                    await expect(page.locator('text=FINANCIEROS REINVERTIDAS').first()).toBeVisible();
                
                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);
            
                    // Titular
                    const campoTitular = page.locator(`${selectBuscar}`).first();
                    await campoTitular?.fill(`${cedulaEmpresa}`);

                    // Esperar a que el servicio de busqueda de personas cargue
                    await page.waitForResponse(`${servicio_busqueda_personas_crear}`);
                    await page.waitForTimeout(3000);

                    // Seleccionar la opcion que aparece
                    await page.locator(`text=${cedulaEmpresa}`).click(); 
            
                    // Cambiar la descripcion de la cuenta
                    const descripcionCuenta = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
                    // Viene con una descripcion por defecto, borrar dicha descripcion
                    await descripcionCuenta.clear();
                    // Nueva descripcion de la cuenta
                    await descripcionCuenta.fill('Cuenta de certificado financiero reinvertida');
            
                    // La categoria del socio debe ser socio ahorrante
                    await expect(page.locator('text=SOCIO EMPRESARIAL')).toBeVisible();
            
                    // Buscar una cuenta de la persona sin colocar un monto
                    const campoBuscarCuenta = page.locator(`${selectBuscar}`).last();
                    await campoBuscarCuenta.click();
                    // Elegir la cuenta de ahorros
                    await page.locator('text=AHORROS NORMALES').click();

                    // Debe aparecer una alerta de error
                    await expect(page.getByText('No se pudo agregar la cuenta. Completar los campos requeridos.').first()).toBeVisible();

                    // Cerrar la alerta de error
                    await page.locator(`${ariaCerrar}`).first().click();
            
                    // Boton Agregar la cuenta
                    const botonAgregar = page.getByRole('button', {name: 'plus Agregar'});
                    await expect(botonAgregar).toBeVisible();
                    // Click al boton 
                    await botonAgregar.click();
                    
                    // Debe aparecer una alerta de error
                    await expect(page.getByText('No se pudo agregar la cuenta. Completar los campos requeridos.').last()).toBeVisible();

                    // Cerrar la alerta de error
                    await page.locator(`${ariaCerrar}`).first().click();
                });

                test('Crear una Nueva Cuenta de Certificado - Paso 1 - Datos Generales', async () => {
                    // Plazo
                    await page.getByPlaceholder('PLAZO').fill('60');
            
                    // El plazo debe ser mensual, que es el que viene por defecto
                    await expect(page.locator('text=MENSUAL')).toBeVisible();
            
                    // Ver los rangos del monto de apertura
                    await page.locator('[aria-label="eye"]').click();
                    // Debe salir un modal
                    const modalRangos = page.getByRole('heading', {name: 'Detalles de Rango'}).first();
                    await expect(modalRangos).toBeVisible();
            
                    // Debe mostrar que el monto minimo es 1 peso dominicano
                    await expect(page.getByRole('cell', {name: 'RD$ 1.00'}).nth(1)).toBeVisible();
            
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'check Aceptar'}).nth(1).click();
            
                    // El modal se debe cerrar
                    await expect(modalRangos).not.toBeVisible();
            
                    // Ingresar un monto valido
                    const campoMonto = page.getByPlaceholder('MONTO');
                    await campoMonto.clear();
                    await campoMonto.fill('400000');
            
                    // Desmarcar el via de cobro, debito a cuenta
                    const casillaDebitoCuenta = page.getByLabel('Débito a cuenta(s)');
                    await casillaDebitoCuenta.click();
            
                    // Debe salir una advertencia
                    await expect(page.locator('text=Via Cobro es requerido.')).toBeVisible();
            
                    // Marcar la casilla de debito a cuenta
                    await casillaDebitoCuenta.click();
            
                    // Ingresar la tasa
                    await page.locator('#FINANCIEROS\\ REINVERTIDAS_TASA').fill('5');
            
                    // Click al boton de cargar autorizacion
                    await expect(page.getByRole('button', {name: 'Cargar Autorización'})).toBeVisible();

                    // El boton de subir la firma no debe estar visible
                    await expect(page.getByRole('button', {name: 'upload Cargar'}).getByRole('button', {name: 'upload Cargar', exact: true}).filter({hasText: 'Cargar'})).not.toBeVisible();
            
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
            
                    // Click al boton de Continuar
                    const botonContinuar = page.getByRole('button', {name: 'Continuar'});
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
                });
            
                test('Crear una Nueva Cuenta de Certificado - Paso 2 - Contacto de Firmante', async () => {            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_reinvertidas}/create?step=2`);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Cambiar a la pestaña de Personas o Contactos
                    const seccionPersonaContactos = page.locator('text=Personas o Contactos');
                    await seccionPersonaContactos.click();
            
                    // Titulo de la seccion debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CONTACTOS CON LA PERSONAS O EMPRESA'})).toBeVisible();
            
                    // Regresar a la seccion de firmantes
                    await page.getByRole('tab').filter({hasText: 'Firmantes'}).click();
            
                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.locator('text=Agregar Firmante');
                    await expect(botonAgregarFirmantes).toBeVisible();
                    // Click al boton
                    await botonAgregarFirmantes.click();
            
                    // Agregar un firmante, debe salir un modal
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();
            
                    // El socio relacionado a la persona juridica debe estar visible en el modal
                    await expect(page.locator(`text=${nombreFirmante} ${apellidoFirmante}`)).toBeVisible();

                    // Click en Seleccionar
                    await page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`}).getByRole('button', {name: 'Seleccionar'}).click();
            
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
            
                test('Crear una Nueva Cuenta de Certificado - Paso 3 - Metodo de Interes', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_reinvertidas}/create?step=3`);
            
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta que se esta creando, y el titular
                    await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();
                });
            
                test('Finalizar con la Creacion de Cuenta de Certificado', async () => {
                    // Esperar que el mensaje de que los contratos se hayan generado se muestre
                    await expect(page.locator('text=Contratos Generados Exitosamente.')).toBeVisible();
                    
                    // Boton de Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
                    
                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page2.close();
                    await page1.close();

                    // Debe regresar a la pagina de los certificados
                    await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_reinvertidas}`);
                });

                test('Las opciones con los tipos de captacion deben estar visibles', async () => {
                    // Click al selector de tipos captacion
                    await expect(page.locator('#form').getByTitle('FINANCIEROS REINVERTIDAS')).toBeVisible();
                    await page.locator('#form').getByTitle('FINANCIEROS REINVERTIDAS').click();

                    // Todos los tipos de captacion deben estar visibles
                    await expect(page.getByRole('option', {name: 'FINANCIEROS PAGADERAS'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'FINANCIEROS REINVERTIDAS'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'INVERSION PAGADERAS'})).toBeVisible();
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