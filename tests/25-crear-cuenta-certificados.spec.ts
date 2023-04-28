import { APIResponse, Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Parametros de relation
interface EditarAhorrosParametros {
    ID_OPERACION: '' | 1 | 30
};

const EscenariosPrueba: EditarAhorrosParametros[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 1
    },
    {
        ID_OPERACION: 30
    }
];

// Pruebas

test.describe('Certificados - Financieros Pagaderas - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el es escenario es ${Object.values(escenario).toString()}`, () => {
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
                await page.route(/\/relation/, async (route) => {
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
            });
        
            // Funcion con el boton de continuar, que se repite en cada seccion del registro
            const Continuar = async () => {
                // continuar
                const botonContinuar = page.locator('button:has-text("Continuar")');
                // presionar el boton
                await botonContinuar.click();
            };
        
            test('Ir a la opcion de Certificados', async () => {
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Certificados
                await page.getByRole('menuitem', {name: 'Certificados'}).first().click();
            });
        
            test('Elegir un tipo de certificado', async () => {
                // Boton de seleccionar captaciones
                const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
                await expect(botonCaptaciones).toBeVisible();
                // Click al boton
                await botonCaptaciones.click();
        
                // Constante con la opcion de financieros pagaderas
                const tipoCertificado = page.locator('text=FINANCIEROS PAGADERAS');

                if (await tipoCertificado.isHidden()) {
                    // Recargar la pagina
                    await page.reload();
                    // Seleccionar el tipo de captacion financieros pagaderas
                    await botonCaptaciones.click();
                    await page.locator('text=FINANCIEROS PAGADERAS').click();
                } else if (await tipoCertificado.isVisible()) {
                    // Seleccionar el tipo de captacion financieros pagaderas
                    await page.locator('text=FINANCIEROS PAGADERAS').click();
                }
        
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8`);

                // El titulo debe estar presente
                await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();
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
            } else if (escenario.ID_OPERACION === 1) {
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
                test('Crear una Nueva Cuenta de Certificado - Paso 1 - Datos Generales', async () => {
                    // Cedula de la persona almacenada en el state
                    const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=1`);
            
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE CERTIFICADOS'})).toBeVisible();
            
                    // La cuenta debe ser de financieros pagaderos
                    await expect(page.locator('text=FINANCIEROS PAGADERAS').first()).toBeVisible();
            
                    // Titular
                    const campoTitular = page.locator('#select-search').first();
            
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
            
                    // No debe permitir un monto menor de 1
                    const campoMonto = page.getByPlaceholder('MONTO');
                    await campoMonto.fill('0');
            
                    // Debe salir una advertencia
                    await expect(page.locator("text='Monto' debe estar entre 1 y 99999999999")).toBeVisible();
            
                    // Ingresar un monto valido
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
                    await page.locator('text=Cargar Autorización').click();

                    // El boton de subir la firma no debe estar visible
                    await expect(page.getByRole('button', {name: 'upload Cargar'}).getByRole('button', {name: 'upload Cargar', exact: true}).filter({hasText: 'Cargar'})).not.toBeVisible();
            
                    // El titulo de origen de inversion debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'ORIGEN DE INVERSIÓN'})).toBeVisible();
            
                    // Buscar una cuenta de la persona
                    const campoBuscarCuenta = page.locator('#select-search').last();
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
                    Continuar();
                });
            
                test('Crear una Nueva Cuenta de Certificado - Paso 2 - Contacto de Firmante', async () => {
                    // Cedula, nombre y apellido de la persona relacionada almacenada en el state
                    const cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                    const nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                    const apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
            
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
                    await page.locator('[aria-label="close"]').first().click();
                    await page.locator('[aria-label="close"]').first().click();
            
                    // Boton de Agregar Firmantes debe estar visible
                    const botonAgregarFirmantes = page.locator('text=Agregar Firmante');
                    await expect(botonAgregarFirmantes).toBeVisible();
                    // Click al boton
                    await botonAgregarFirmantes.click();
            
                    // Agregar un firmante, debe salir un modal
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();
            
                    // Bucar un socio
                    const buscador = page.locator('#select-search');
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
            
                test('Crear una Nueva Cuenta de Certificado - Paso 3 - Metodo de Interes', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=3`);
            
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();
                });
            
                test('Finalizar con la Creacion de Cuenta de Certificado', async () => {
                    // Boton de Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")');
                    // Esperar que se abran dos pestañas
                    const [newPage, newPage2] = await Promise.all([
                        context.waitForEvent('page'),
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonFinalizar).toBeVisible(),
                        await botonFinalizar.click()
                    ]);
                  
                    // Cerrar las dos paginas abiertas
                    await newPage.close();
                    await newPage2.close();

                    // Debe regresar a la pagina de los certificados
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8`)
                });
            }
            
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();
        
                // Cerrar el context
                await context.close();
            });
        });
    }
})