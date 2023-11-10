import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { ariaCerrar, selectBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearCuentas } from './utils/dataPages/interfaces';
import { diaActualFormato } from './utils/functions/fechas';
import { url_base, url_cuentas_ahorros, url_cuentas_ahorros_normales } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

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

// Pruebas
test.describe.serial('Crear Cuenta de Ahorros - Ahorros Normales - Pruebas con los diferentes parametros', async () => {
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
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}/create?step=1`);
            
                    // El titulo de Registrar Cuenta debe estar visible
                    await expect(page.locator('text=CREAR CUENTA DE AHORROS')).toBeVisible();

                    // Botones con los pasos del formulario
                    await expect(page.getByText('Datos Generales')).toBeVisible();
                    await expect(page.getByText('Firmantes y Contactos')).toBeVisible();
                    await expect(page.getByText('Método de Intereses')).toBeVisible();
                });
            
                test('Llenar los campos del primer paso del registro de cuenta de ahorros', async () => {
                    // Numero de cuenta
                    await expect(page.locator('#AHORROS\\ NORMALES_ID_CUENTA')).not.toBeEditable();

                    // Fecha de apertura, debe ser la fecha actual
                    const fechaApetura = page.locator('#AHORROS\\ NORMALES_FECHA_APERTURA');
                    await expect(fechaApetura).toBeDisabled();
                    await expect(fechaApetura).toHaveValue(`${diaActualFormato}`);
                    
                    // Titular
                    const campoTitular = page.locator(`${selectBuscar}`);
                    await campoTitular?.fill(`${cedula}`);

                    // Esperar a que el servicio de busqueda de personas cargue
                    await page.waitForResponse('**/persona/personas?page=1&size=10');
                    await page.waitForTimeout(3000);

                    // Seleccionar la opcion que aparece
                    await page.locator(`text=${cedula}`).click();
            
                    // El tipo de captacion debe ser Ahorros
                    await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();

                    // Retenciones
                    await expect(page.getByText('RETENCION PERSONA FISICA 10%')).toBeVisible();

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
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}/create?step=2`);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Cambiar a la pestaña de Personas o Contactos
                    const seccionPersonaContactos = page.locator('text=Personas o Contactos');
                    await seccionPersonaContactos.click();
            
                    // Titulo de la seccion debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CONTACTOS CON LA PERSONAS O EMPRESA'})).toBeVisible();
            
                    // Regresar a la seccion de firmantes
                    await page.getByRole('tab').filter({hasText: 'Firmantes'}).click();
            
                    // Cerrar uno de los mensajes que aparecen
                    await page.locator(`${ariaCerrar}`).first().click();
            
                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.locator('text=Agregar Firmante');
                    await expect(botonAgregarFirmantes).toBeVisible();
            
                    // El titular debe estar en la tabla de los firmantes
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
            
                    // Se debe mostrar la firma del titular por defecto
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El tipo de firma requerida debe estar visible
                    await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();
            
                    // Boton de Guardar y Continuar
                    const botonGuardaryContinuar = page.getByRole('button', {name: 'Guardar y continuar'});
                    await expect(botonGuardaryContinuar).toBeVisible();
                    await botonGuardaryContinuar.click();
                });
            
                test('Metodo de intereses', async () => {
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}/create?step=3`);
                    
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
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}`);
            
                    // El titulo de Ahorros debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
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
        
            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});

