import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, ariaCerrar, selectBuscar, browserConfig } from './utils/dataTests';
import { EscenariosPruebaCrearCuentas } from './utils/interfaces';
import { url_cuentas_aportaciones, url_cuentas_ahorros_infantiles } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Cuenta
let botonNuevaCuenta: Locator;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Cedula, nombre y apellido del menor
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Cedula, nombre y apellido de la madre
let cedulaMadre: string | null;
let nombreMadre: string | null;
let apellidoMadre: string | null;

// Pruebas
test.describe.serial('Apertura de Cuenta de Aportaciones y luego la de Ahorros - Menor de Edad - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: browserConfig.headless,
                    args: browserConfig.args
                });
        
                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json'
                });
        
                // Crear una page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicicion para cambiar los parametros del body
                    if (Object.keys(body?.data[33]).length > 1) {
                        // Reemplazar el body con la response con los datos del escenarios
                        body.data[33] = Object.assign(body.data[33], escenarios);
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

                // Cedula, nombre y apellido del menor almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaMenor'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombreMenor'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoMenor'));
        
                // Nombre de la persona alamcenada en el state, osea su madre
                cedulaMadre = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombreMadre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellidoMadre = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            });
        
            test('Ir a Apertura de cuenta de aportaciones', async () => {
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Captaciones
                await page.getByRole('menuitem', {name: 'Aportaciones'}).first().click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_cuentas_aportaciones}`);
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();
            });

            if (escenarios.ID_OPERACION !== 30) {
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
            } else if (escenarios.ID_OPERACION === 30) {
                // Tests cuando el ID_OPERACION es 30
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones}/create?step=1`);
                });
            
                test('Registrar Cuenta de Aportaciones del Menor - Datos Generales', async () => {
                    // El titulo de registrar cuenta deb estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();
            
                    // Ingresar el titular
                    const campoTitular = page.locator(`${selectBuscar}`);
                    await campoTitular?.fill(`${cedula}`);
                    // Click a la opcion que coincide con lo buscado
                    await page.locator(`text=${cedula}`).click();
            
                    // El nombre y el apellido de la persona deben aparecer como un titulo
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();
            
                    // Se debe mostrar una alerta diciendo que el socio elegido es un menor
                    await expect(page.locator('text=El socio seleccionado es un menor de edad, por lo tanto es obligatorio agregar a un tutor a esta cuenta.')).toBeVisible();
            
                    // El tipo de captacion debe ser Aportaciones
                    await expect(page.locator('#APORTACIONES_ID_TIPO_CAPTACION').nth(1)).toBeVisible();
            
                    // Seleccionar una categoria
                    const campoCategoria = page.locator('#APORTACIONES_ID_CATEGORIA_SOCIO');
                    await campoCategoria.click();
                    // Elegir la categoria de socio ahorrante
                    await page.locator('text=SOCIO AHORRANTE').click();
            
                    // El tutor se debe elegir automaticamente
                    await expect(page.locator(`text=${nombreMadre} | MADRE`)).toBeVisible();
            
                    // Boton de Continuar
                    const botonContinuar = page.getByRole('button', {name: 'Continuar'});
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();
                });
            
                test('Registrar Cuenta de Aportaciones del Menor - Contacto de Firmante o Persona', async () => {
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Cerrar uno de los mensajes que se muestran
                    await page.locator(`${ariaCerrar}`).last().click();
            
                    // Se debe mostrar la firma del titular por defecto
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El tipo de firma requerida debe estar visible
                    await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();
            
                    // Probar que no se pueda continuar sin agregar un firmante a la cuenta del menor
                    const botonContinuar = page.getByRole('button', {name: 'Continuar'}); 
                    await botonContinuar.click();
                    
                    // Se debe mostrar un mensaje
                    await expect(page.locator('text=Debe agregar como firmante al representante legal del socio.')).toBeVisible();
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Colocar la firma del tutor del menor
            
                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.getByRole('button', {name: 'plus Agregar Firmante'});
                    await expect(botonAgregarFirmantes).toBeVisible();
                    // Click al boton
                    await botonAgregarFirmantes.click();
            
                    // Agregar un firmante, debe salir un modal
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();
            
                    // La madre se debe mostrar sin tener que buscarla
                    await expect(page.locator(`text=${nombreMadre} ${apellidoMadre}`)).toBeVisible();
            
                    // Seleccionar el tutor
                    await page.getByRole('button', {name: 'Seleccionar'}).click();
            
                    // Debe salir otro modal para llenar la informacion de la firmante
                    await expect(page.locator('text=FIRMANTE:')).toBeVisible();
            
                    // Tipo firmante
                    await page.locator('#form_TIPO_FIRMANTE').click();
                    // Seleccionar un tipo de firmante
                    await page.getByRole('option', {name: 'MADRE'}).click();
            
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
                    await page.locator('#form_ID_TESTIGO').click();
                    // Seleccionar un testigo, la primera opcion que aparezca
                    await page.getByRole('option').nth(0).click();
            
                    // Boton de Aceptar
                    const botonAceptar = page.locator('text=Aceptar');
                    // Esperar que se abra una nueva pestaña con el reporte de poder a terceros
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(botonAceptar).toBeVisible(),
                        await botonAceptar.click()
                    ]);
                  
                    // La pagina abierta con el reporte se cierra
                    await newPage.close();
            
                    // El firmante agregado se debe mostrar
                    await expect(page.getByRole('row', {name: `${nombreMadre} ${apellidoMadre}`})).toBeVisible();
            
                    // Boton de Guardar y Continuar
                    const botonGuardaryContinuar = page.getByRole('button', {name: 'Guardar y continuar'});
                    await expect(botonGuardaryContinuar).toBeVisible();
                    await botonGuardaryContinuar.click();
                });
            
                test('Registrar Cuenta de Aportaciones del Menor - Método de intereses', async () => {
                    // El titulo de  debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta donde se va a depositar 
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                });
            
                test('Finalizar con el Registro de la Cuenta de Aportaciones', async () => {
                    // Boton de finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
                
                    // Debe de aparecer un modal
                    await expect(page.locator('text=¿Desea crear una cuenta de ahorro para este socio?')).toBeVisible();
                    // Click en Aceptar para crearle una cuenat de Ahorros al socio
                    await page.getByRole('dialog').getByRole('button', {name: 'Sí'}).click();
                });
            
                test('Crear la Cuenta de Ahorros del Menor - Datos Generales', async () => {
                    // Debe redirigirse a la creacion de la cuenta de ahorros
                    await expect(page).toHaveURL(/\/ahorros/);
            
                    // Titulo de editar cuenta, ya que se crea automaticamente
                    await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();

                    // Cerrar las alertas
                    await page.locator(`${ariaCerrar}`).first().click();
                    await page.locator(`${ariaCerrar}`).last().click();
            
                    // La cuenta debe ser la del socio
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();
            
                    // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
                    await expect(page.locator('text=AHORROS INFANTILES')).toBeVisible();
            
                    // La categoria debe ser Socio Ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();
            
                    // Editar el monto de confirmacion
                    const montoConfirmacion = page.getByPlaceholder('MONTO DE CONFIRMACIÓN');
                    await expect(montoConfirmacion).toBeVisible();
                    await montoConfirmacion.clear();
                    await montoConfirmacion.fill('25,000');
            
                    // Subir la imagen de la firma
                    const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
                    await page.getByText('Cargar ').click(); 
                    const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
                    await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo
            
                    // Boton de Actualizar
                    const botonActualizar = page.locator('text=Actualizar');
                    await expect(botonActualizar).toBeVisible();
                    await botonActualizar.click();
                });

                test('Crear la Cuenta de Ahorros del Menor - Contacto de Firmante', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTE'})).toBeVisible();

                    // Debe estar la firma del titular por defecto
                    await expect(page.getByText('TITULAR')).toBeVisible();

                    // Cerrar las alertas
                    await page.locator(`${ariaCerrar}`).first().click();
                    await page.locator(`${ariaCerrar}`).last().click();
                    await page.locator(`${ariaCerrar}`).last().click();
                    await page.locator(`${ariaCerrar}`).last().click();

                    // Boton de Guardar y Continuar, probar que no se pueda continuar sin agregar un representante
                    const botonGuardaryContinuar = page.getByRole('button', {name: 'Guardar y continuar'});
                    await expect(botonGuardaryContinuar).toBeVisible();
                    await botonGuardaryContinuar.click();

                    // Se debe mostrar un mensaje
                    await expect(page.locator('text=Debe agregar como firmante al representante legal del socio.')).toBeVisible();
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.getByRole('button', {name: 'plus Agregar Firmante'});
                    await expect(botonAgregarFirmantes).toBeVisible();
                    // Click al boton
                    await botonAgregarFirmantes.click();
            
                    // Agregar un firmante, debe salir un modal
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();
            
                    // La madre debe mostrarse sin tener que buscarlo
                   await expect(page.locator(`text=${nombreMadre} ${apellidoMadre}`)).toBeVisible();
            
                   // Seleccionar el representante
                   await page.getByRole('button', {name: 'Seleccionar'}).click();
            
                    // Debe salir otro modal para llenar la informacion de la firmante
                    await expect(page.locator('text=FIRMANTE:')).toBeVisible();
            
                    // Tipo firmante
                    await page.locator('#form_TIPO_FIRMANTE').click();
                    // Seleccionar un tipo de firmante
                    await page.getByRole('option', {name: 'MADRE'}).click();
            
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
                    // Esperar que se abra una nueva pestaña con el reporte de poder a terceros
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(botonAceptar).toBeVisible(),
                        await botonAceptar.click()
                    ]);
                  
                    // La pagina abierta con el reporte se cierra
                    await newPage.close();
            
                    // El firmante agregado se debe mostrar
                    await expect(page.getByRole('row', {name: `${nombreMadre} ${apellidoMadre}`})).toBeVisible();
            
                    // Boton Guardar y Continuar
                    await botonGuardaryContinuar.click();
                });
                
                test('Crear la Cuenta de Ahorros - Método de intereses', async () => {
                    // El titulo de  debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta que se esta creando, y el titular
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                });
            
                test('Finalizar con el registro de cuenta de ahorro', async () => {
                    // Esperar que el mensaje de que los contratos se hayan generado se muestre
                    await expect(page.locator('text=Contratos Generados Exitosamente.')).toBeVisible();

                    // Boton de Finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
                  
                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
                    
                    // Debe de regresar a la pagina las cuentas de ahorros infantiles
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_infantiles}`);
            
                    // El titulo de Ahorros Infantiles debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
                });
            };
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la pge
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });    
    };
});

