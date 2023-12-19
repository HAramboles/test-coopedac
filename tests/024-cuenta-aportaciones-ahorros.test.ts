import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { ariaCerrar, formBuscar, selectBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearCuentas } from './utils/dataPages/interfaces';
import { url_base, url_cuentas_aportaciones, url_cuentas_ahorros_normales } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { nombreTestigoCajero } from './utils/data/usuarios';

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
test.describe.serial('Apertura de Cuenta de Aportaciones y luego la de Ahorros - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser, con la propiedad headless
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
                        body.data[33] = Object.assign(body.data[33], escenarios);
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

                // Cedula, nombre y apellido de la persona relacionada almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
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
                // Tests si el ID_OPERACION es 30
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones}/create?step=1`);
                });
            
                test('Registrar Cuenta de Aportaciones - Datos Generales', async () => { 
                    // El titulo de registrar cuenta deb estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();
            
                    // Ingresar el titular
                    const campoTitular = page.locator(`${selectBuscar}`);
                    await campoTitular?.fill(`${cedula}`);
                    // Click a la opcion que coincide con lo buscado
                    await page.locator(`text=${cedula}`).click();
            
                    // El nombre y el apellido de la persona deben aparecer como un titulo
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();
            
                    // El tipo de captacion debe ser Aportaciones
                    await expect(page.locator('#APORTACIONES_ID_TIPO_CAPTACION').nth(1)).toBeVisible();
            
                    // Seleccionar una categoria
                    const campoCategoria = page.locator('#APORTACIONES_ID_CATEGORIA_SOCIO');
                    await campoCategoria.click();
                    // Elegir la categoria de socio ahorrante
                    await page.locator('text=SOCIO AHORRANTE').click();
            
                    // Boton de Continuar
                    const botonContinuar = page.getByRole('button', {name: 'Continuar'});
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();
                });
            
                test('Registrar Cuenta de Aportaciones - Contacto de Firmante o Persona', async () => {
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Se debe mostrar la fima del titular por defecto
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El tipo de firma requerida debe estar visible
                    await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();
            
                    // Boton de Guardar y Continuar
                    const botonGuardaryContinuar = page.getByRole('button', {name: 'Guardar y continuar'});
                    await expect(botonGuardaryContinuar).toBeVisible();
                    await botonGuardaryContinuar.click();
                });
            
                test('Registrar Cuenta de Aportaciones - Método de intereses', async () => {
                    // El titulo de  debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta que se esta creando, y el titular
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
            
                test('Crear la Cuenta de Ahorros - Datos Generales', async () => {
                    // Debe redirigirse a la creacion de la cuenta de ahorros
                    await expect(page).toHaveURL(/\/edit/);

                    // Esperar que cargen los datos
                    await page.waitForTimeout(4000);
            
                    // Titulo de editar cuenta, ya que se crea automaticamente
                    await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();
            
                    // La cuenta debe ser la del socio
                    await expect(page.locator('h1').filter({hasText: `| ${nombre} ${apellido}`})).toBeVisible();
            
                    // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
                    await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();
            
                    // La categoria debe ser Socio Ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

                    if (await page.locator('text=SOCIO AHORRANTE').isHidden()) {
                        await page.getByRole('button', {name: 'Omitir'}).click();

                        await page.waitForTimeout(4000);

                        // La URL debe cambiar
                        await expect(page).toHaveURL(/\/?step=2/);

                        await page.waitForTimeout(4000);

                        // 
                        await page.getByRole('button', {name: 'Anterior'}).click();

                        await page.waitForTimeout(4000);

                        // La URL debe cambiar
                        await expect(page).toHaveURL(/\/?step=1/);
                    }

                    // Esperar que carguen los datos de la pagina
                    await page.waitForTimeout(3000);
            
                    // Editar el monto de confirmacion
                    const montoConfirmacion = page.getByPlaceholder('MONTO DE CONFIRMACIÓN');
                    await expect(montoConfirmacion).toBeVisible();
                    await montoConfirmacion.clear();
                    await page.waitForTimeout(1000);
                    await montoConfirmacion.fill('25,000');
            
                    // Subir la imagen de la firma
                    const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
                    await page.getByText('Cargar ').click(); 
                    const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
                    await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo

                    // La firma subida debe estar visible
                    await expect(page.getByAltText('firma.jpg')).toBeVisible();
            
                    // Boton de Actualizar
                    const botonActualizar = page.locator('text=Actualizar');
                    await expect(botonActualizar).toBeVisible();
                    await botonActualizar.click();
                });
            
                test('Crear la Cuenta de Ahorros - Contacto de Firmante', async () => {        
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTE'})).toBeVisible();

                    // Esperar cuatro segundos antes de continuar
                    await page.waitForTimeout(4000);

                    // Cerrar las alertas que se muestran
                    await page.locator(`${ariaCerrar}`).first().click();
            
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
                    
                    // Debe de regresar a la pagina las cuentas de ahorros
                    await expect(page).toHaveURL(`${url_cuentas_ahorros_normales}`);
            
                    // El titulo de Ahorros debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
                });

                test('Las opciones con los tipos de captacion deben estar visibles', async () => {
                    // Esperar que la pagina cargue
                    await page.waitForTimeout(3000);
                    
                    // Click al selector de tipos captacion
                    await expect(page.locator('#form').getByTitle('AHORROS NORMALES')).toBeVisible();
                    await page.locator('#form').getByTitle('AHORROS NORMALES').click();

                    // Todos los tipos de captacion deben estar visibles
                    await expect(page.getByRole('option', {name: 'AHORROS NORMALES'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'AHORROS POR NOMINA'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'AHORROS INFANTILES'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'ORDEN DE PAGO'})).toBeVisible();
                });

                test('Guardar la cuenta de Ahorros Normales creada en el state', async () => {
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

                    // Esperar que se muestre la cuenta de la persona
                    await page.waitForTimeout(2000);

                    // Copiar el codigo de la cuenta
                    await page.getByRole('cell').nth(3).click({clickCount: 4});
                    await page.locator('body').press('Control+c');

                    // Buscar la cuenta por el codigo
                    await page.locator(`${formBuscar}`).clear();
                    await page.locator(`${formBuscar}`).press('Control+v');
                    await page.locator(`${formBuscar}`).press('Backspace');

                    // Esperar que se muestre la cuenta de la persona
                    await page.waitForTimeout(2000);

                    // La cuenta debe estar visible en la tabla
                    let idCuenta = await page.locator(`${formBuscar}`).getAttribute('value');
                    let idCuentaNoGuiones = idCuenta?.replace(/-/g, '');
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Guardar el codigo de la cuenta en el state
                    await page.evaluate((idCuentaNoGuiones) => window.localStorage.setItem('ahorrosNormalesPersonaRelacionada', `${idCuentaNoGuiones}`), `${idCuentaNoGuiones}`);
                });
            };
        
            test.afterAll(async () => { // Despues de todas las pruebas
                // Guardar nuevamente el Storage con el codigo de la cuenta
                await context.storageState({path: 'state.json'});

                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});

