import { APIResponse, Browser, BrowserContext, chromium, Page, expect, Locator, test } from '@playwright/test';
import { url_base, ariaCerrar, selectBuscar } from './utils/dataTests';
import { EscenariosPruebaCrearCuentas } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Cuenta
let botonNuevaCuenta: Locator;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Cedula, nombre y apellido del firmante
let cedulaFirmante: string | null;
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Certificados - Financieros Pagaderas - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
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

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

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
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados`);
        
                // El titulo de Certificadoss debe estar visible
                await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();
            });
        
            test('Seleccionar el Certificado Financieros Pagaderas', async () => {
                // El titulo de tipo de captaciones debe estar visible
                await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();
        
                // Boton de seleccionar captaciones
                const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
                await expect(botonCaptaciones).toBeVisible();
                // Click al boton
                await botonCaptaciones.click();

                // Click a la opcion de Financieros Pagaderas
                const opcionFinancierosPagaderas = page.locator('text=FINANCIEROS PAGADERAS');
                await expect(opcionFinancierosPagaderas).toBeVisible();
                await opcionFinancierosPagaderas.click();
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8`);

                // El tipo de captacion de Financieros PAGADERAS debe estar visible
                await expect(page.locator('#form').getByTitle('FINANCIEROS PAGADERAS')).toBeVisible();
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
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
                });

                test('Crear una Nueva Cuenta de Certificado - Paso 1 - Datos Generales', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE CERTIFICADOS'})).toBeVisible();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=1`);
            
                    // La cuenta debe ser de financieros pagaderos
                    await expect(page.locator('text=FINANCIEROS PAGADERAS').first()).toBeVisible();
            
                    // Titular
                    const campoTitular = page.locator(`${selectBuscar}`).first();
            
                    await campoTitular?.fill(`${cedula}`);
                    // Seleccionar la opcion que aparece
                    await page.locator(`text=${cedula}`).click(); 
            
                    // Cambiar la descripcion de la cuenta
                    const descripcionCuenta = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
                    // Viene con una descripcion por defecto, borrar dicha descripcion
                    await descripcionCuenta.clear();
                    // Nueva descripcion de la cuenta
                    await descripcionCuenta.fill('Cuenta de certificado financiero pagadera');
            
                    // La categoria del socio debe ser socio ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();
            
                    // Plazo
                    await page.getByPlaceholder('PLAZO').fill('24');
            
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
                    await campoMonto.fill('50');
            
                    // Desmarcar el via de cobro, debito a cuenta
                    const casillaDebitoCuenta = page.getByLabel('Débito a cuenta(s)');
                    await casillaDebitoCuenta.click();
            
                    // Debe salir una advertencia
                    await expect(page.locator('text=Via Cobro es requerido.')).toBeVisible();
            
                    // Marcar la casilla de debito a cuenta
                    await casillaDebitoCuenta.click();
            
                    // Ingresar la tasa
                    await page.locator('#FINANCIEROS\\ PAGADERAS_TASA').fill('5');
            
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
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=2`);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Cambiar a la pestaña de Personas o Contactos
                    const seccionPersonaContactos = page.locator('text=Personas o Contactos');
                    await seccionPersonaContactos.click();
            
                    // Titulo de la seccion debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CONTACTOS CON LA PERSONAS O EMPRESA'})).toBeVisible();
            
                    // Regresar a la seccion de firmantes
                    await page.getByRole('tab').filter({hasText: 'Firmantes'}).click();
            
                    // Cerrar los mensajes que aparecen
                    await page.locator(`${ariaCerrar}`).first().click();
                    await page.locator(`${ariaCerrar}`).last().click();
            
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
                    await seleccionarTestigo.click();
                    // Seleccionar un testigo, la primera opcion que aparezca
                    await page.getByRole('option').nth(0).click();
            
                    // Boton de Aceptar
                    const botonAceptar = page.locator('text=Aceptar');
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
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=3`);
            
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Cerrar las alertas
                    await page.locator(`${ariaCerrar}`).first().click();
                    await page.locator(`${ariaCerrar}`).first().click();
                    await page.locator(`${ariaCerrar}`).last().click();

                    // Debe mostrarse la cuenta que se esta creando, y el titular
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Debe mostrarse el valor de 100, todo se depositara en la cuenta de la persona
                    await expect(page.getByRole('cell', {name: '100', exact: true})).toBeVisible();   

                    // Distibuir el monto de intereses

                    // Click al boton de Editar
                    const botonEditarIntereses = page.getByRole('button', {name: 'edit'});
                    await expect(botonEditarIntereses).toBeVisible();
                    await page.getByRole('button', {name: 'edit'}).click();

                    // Debe mostrarse un modal para editar el valor
                    const modalDistribucionIntereses = page.locator('text=EDITAR DISTRIBUCIÓN DE INTERESES');
                    await expect(modalDistribucionIntereses).toBeVisible();

                    // El modal debe contener el nombre del socio
                    await expect(page.getByRole('dialog').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

                    // Input del Valor
                    const inputValor = page.locator('#form_VALOR');
                    await expect(inputValor).toBeVisible();
                    await expect(inputValor).toHaveValue('100%');

                    // Cambiar el valor
                    await inputValor.clear();
                    await inputValor.fill('50');

                    // Click al boton de Aceptar del modal
                    const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Debe mostrarse un mensaje en la pagina
                    await expect(page.locator('text=Captaciones cuenta deposito actualizada exitosamente.')).toBeVisible();

                    // Debe mostrar un mensaje de aviso
                    await expect(page.locator('text=El total de la columna VALOR debe sumar 100')).toBeVisible();

                    // Digitar la cedula del firmante en el buscador de socio
                    await page.locator(`${selectBuscar}`).click();
                    await page.locator(`${selectBuscar}`).fill(`${cedulaFirmante}`);

                    // Esperar a que se vean las cuentas de la persona buscada
                    await expect(page.getByRole('option', {name: `${nombreFirmante} ${apellidoFirmante}`}).first()).toBeVisible();

                    // Deben salir todas las cuentas que posee la persona, elegir la cuenta de ahorros normales
                    await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();
                    await page.locator('text=AHORROS NORMALES').click();

                    // Debe salir un modal para agregar el valor de los intereses que se le enviaran a la cuenta
                    await expect(modalDistribucionIntereses).toBeVisible();

                    await expect(inputValor).toBeVisible();
                    // Debe tener el valor de 50
                    await expect(inputValor).toHaveValue('50%');

                    // Click al boton de Aceptar del modal
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Ahora deben mostrarse las cuentas
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                    await expect(page.getByRole('cell', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

                    // Los valores deben estar divididos en 50 y 50
                    await expect(page.getByRole('cell', {name: '50'}).first()).toBeVisible();
                    await expect(page.getByRole('cell', {name: '50'}).last()).toBeVisible();
                });
            
                test('Finalizar con la Creacion de Cuenta de Certificado', async () => {
                    // Esperar que el mensaje de que los contratos se hayan generado se muestre
                    await expect(page.locator('text=Contratos Generados Exitosamente.')).toBeVisible();
                    
                    // Boton de Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
                    
                    // Esperar que se abran dos pestañas
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas abiertas
                    await page1.close();
                    await page2.close();

                    // Debe regresar a la pagina de los certificados
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8`);
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