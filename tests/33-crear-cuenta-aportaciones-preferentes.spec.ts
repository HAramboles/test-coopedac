import { APIResponse ,Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';
import { url_base, CrearCuentas, ariaCerrar, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Cedula de la persona
let cedula: string | null;

// Cedula, nombre y apellido del firmante
let cedulaFirmante: string | null;
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Parametros de relation
const EscenariosPrueba: CrearCuentas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 30
    }
];

// Pruebas

test.describe('Aportaciones Preferentes - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: false,
                });
        
                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json'
                });
        
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

                // Cedula de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

                // Cedula, nombre y apellido de la persona relacionada almacenada en el state
                cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
            });
        
            // Funcion con el boton de continuar, que se repite en cada seccion del registro
            const Continuar = async () => {
                // continuar
                const botonContinuar = page.locator('button:has-text("Continuar")');
                // presionar el boton
                await botonContinuar.click();
            };
        
            test('Ir a la opcion de Aportaciones Preferentes', async () => {
                // Captaciones
                await page.locator('text=CAPTACIONES').click();
        
                // Apertura de cuentas
                await page.locator('text=APERTURA DE CUENTAS').click();
        
                // Captaciones
                await page.getByRole('menuitem', {name: 'Aportaciones Preferentes', exact: true}).click();
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
                        
                // Condicion por si el tipo de captacion llega sin datos o con datos
                const tipoCaptacion = page.getByTitle('APORTACIONES PREFERENTES', {exact: true});
        
                if (await tipoCaptacion.isHidden()) {
                    // Si no llega el tipo de captacion, manualmente dirigise a la url de las aportaciones preferentes
                    await page.goto(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);
                } else if (await tipoCaptacion.isVisible()) {
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);

                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
                }
            });

            if (escenario.ID_OPERACION === '') {
                // Test si el ID_OPERACION es Vacio
                test('No debe permitir Crear una Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();

                    // Debe salir un mensaje
                    await expect(page.getByRole('dialog').getByText('No tiene permisos para crear cuentas')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
                    // Skip al test
                    test.skip();
                });
            } else if (escenario.ID_OPERACION === 10) {
                // Test si el ID_OPERACION es diferente de 30
                test('No debe permitir Crear una Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();

                    // Debe salir un mensaje
                    await expect(page.getByRole('dialog').getByText('No tiene permisos para crear cuentas')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
                    // Skip al test
                    test.skip();
                });
            } else if (escenario.ID_OPERACION === 30) {
                test('Crear cuenta de Aportaciones Preferentes - Paso 1 - Datos Generales', async () => {
                    test.slow();

                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=1`);
            
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();
            
                    // El titulo de la seccion debe estar visible
                    await expect(page.locator('text=Datos Generales')).toBeVisible();
            
                    // Buscar un socio
                    await page.locator(`${selectBuscar}`).first().fill(`${cedula}`);
                    // Click al socio
                    await page.locator(`text=${cedula}`).click();
            
                    // Cambiar al descripcion de la cuenta
                    const descripcion = page.locator('#APORTACIONES\\ PREFERENTES_DESCRIPCION');
                    await descripcion.fill('Cuenta de Aportaciones Preferentes');
            
                    // La categoria debe ser de socio ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

                    // Monto disponible en aportaciones
                    await expect(page.getByText('Monto disponible en aportaciones es: 2,000.00')).toBeVisible();

                    // Ingresar un monto mayor al maximo de apertura
                    await expect(page.getByText('Monto máximo de apertura: 6,000.00')).toBeVisible();

                    // Ingresar un monto mayor al maximo de apertura
                    const montoApertura = page.locator('#APORTACIONES\\ PREFERENTES_MONTO_APERTURA');
                    await montoApertura.fill('8,000');

                    // Click fuera del input
                    await page.getByTitle('Titular').click();

                    // Debe salir un modal de error
                    await expect(page.locator('text=El monto máximo de apertura es 6,000.00')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Ingresar un monto de apertura correcto
                    await montoApertura.clear();
                    await montoApertura.fill('1500');
                    // Click fuera del input
                    await page.getByTitle('Titular').click();

                    // Plazo
                    await page.locator('#APORTACIONES\\ PREFERENTES_PLAZO').fill('12');

                    // Revisar que los rangos esten visibles
                    await page.locator('[aria-label="eye"]').click();
                    // Debe salir un modal
                    const modalRangos = page.getByRole('heading', {name: 'Detalles de Rango'}).first();
                    await expect(modalRangos).toBeVisible();

                    // El monto minimo debe estar visible
                    await expect(page.getByText('RD$ 1.00').first()).toBeVisible();

                    // El plazo minimo debe estar visible
                    await expect(page.getByRole('cell', {name: '1', exact: true}).nth(1)).toBeVisible();

                    // Click en Aceptar para cerrar el modal de los rangos
                    await page.getByRole('button', {name: 'check Aceptar'}).nth(1).click();

                    // El modal no se debe mostrar
                    await expect(modalRangos).not.toBeVisible();
            
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
                    // Esperar que se abra una nueva pestaña con el reporte de la nota de debito
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(botonContinuar).toBeVisible(),
                        await botonContinuar.click()
                    ]);

                    // Cerrar la pagina con el reporte de la nota de debito
                    newPage.close();
                });
            
                test('Crear cuenta de Aportaciones Preferentes - Paso 2 - Contacto de Firmante', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=2`);
            
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
                    await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();
            
                    // Click al boton de Continuar
                    Continuar();
                });
            
                test('Crear cuenta de Aportaciones Preferentes - Paso 3 - Metodo de Interes', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=2`);
            
                    // El titulo debe estar visible
                    await expect(page.locator('text=FORMA PAGO DE INTERESES O EXCEDENTES')).toBeVisible();
                });
            
                test('Finalizar con el registro de cuenta de aportaciones preferentes', async () => {
                    // Esperar que el mensaje de que los contratos se hayan generado se muestre
                    await expect(page.locator('text=Contratos Generados Exitosamente.')).toBeVisible();
                    
                    // Boton de Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")');
                    // Esperar que se abra una nueva pestaña
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonFinalizar).toBeVisible(),
                        await botonFinalizar.dblclick()
                    ]);
                  
                    // La pagina abierta con la solicitud se cierra
                    await newPage.close();
                    
                    // Debe de regresar a la pagina las cuentas de ahorros
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);
            
                    // El titulo de Ahorros debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
                });
            };
            
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerra la page
                await page.close();
            });
        });
    }
})