import { APIResponse ,Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Parametros de actividad_parametro
interface AportacionePreferentesParametros {
    REQUIERE_FIRMA_TITULAR: 'N' | 'S' | ''
}

const EscenariosPruebas: AportacionePreferentesParametros[] = [
    {
        REQUIERE_FIRMA_TITULAR: 'N'
    },
    {
        REQUIERE_FIRMA_TITULAR: ''
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S'
    }
]

// Pruebas

test.describe('Aportaciones Preferentes - Pruebas con los diferentes parametros', () => {
    for (const escenario of EscenariosPruebas) {
        test.describe(`Test cuando el escenario es ${Object.values(escenario).toString()}`, () => {
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

                // Eventos para la request actividad_parametro
                await page.route(/\/actividad_parametro/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        // Reemplazar el body de la response con los datos de los escenarios
                        body.data = Object.assign(body.data, escenario);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        });
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
                    await page.reload();
                } else if (await tipoCaptacion.isVisible()) {
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);
                }
            });
        
            test('Click al boton de Nueva Cuenta', async () => {
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);
        
                // El titulo debe estar presente
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
        
                // Nueva Cuenta
                const botonNuevaCuenta = page.getByRole('button', {name: 'Nueva Cuenta'});
                await expect(botonNuevaCuenta).toBeVisible();
                await botonNuevaCuenta.click();
            });

            if (escenario.REQUIERE_FIRMA_TITULAR === 'N') {
                test('Test si el escenario, Requiere Firma Titular, es N o vacio', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=1`);
                
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();

                    // El boton de subir la firma no debe estar visible
                    await expect(page.getByRole('button', {name: 'upload Cargar'}).getByRole('button', {name: 'upload Cargar', exact: true}).filter({hasText: 'Cargar'})).not.toBeVisible();
                    
                    // Skip al test
                    test.skip();
                });
            } else if (escenario.REQUIERE_FIRMA_TITULAR === '') {
                test('Test si el escenario, Requiere Firma Titular, es N o vacio', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=1`);
                
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();

                    // El boton de subir la firma no debe estar visible
                    await expect(page.getByRole('button', {name: 'upload Cargar'}).getByRole('button', {name: 'upload Cargar', exact: true}).filter({hasText: 'Cargar'})).not.toBeVisible();
                    
                    // Skip al test
                    test.skip();
                });
            } else if (escenario.REQUIERE_FIRMA_TITULAR === 'S') {
                test('Crear cuenta de Aportaciones Preferentes - Paso 1 - Datos Generales', async () => {
                    // Cedula de la persona almacenada en el state
                    const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=1`);
            
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();
            
                    // El titulo de la seccion debe estar visible
                    await expect(page.locator('text=Datos Generales')).toBeVisible();
            
                    // Buscar un socio
                    await page.locator('#select-search').first().fill(`${cedula}`);
                    // Click al socio
                    await page.locator(`text=${cedula}`).click();
            
                    // Cambiar al descripcion de la cuenta
                    const descripcion = page.locator('#APORTACIONES\\ PREFERENTES_DESCRIPCION');
                    await descripcion.fill('Cuenta de Aportaciones Preferentes');
            
                    // La categoria debe ser de socio ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();
            
                    // Ingresar un monto inicial
                    await page.locator('#APORTACIONES\\ PREFERENTES_MONTO_APERTURA').fill('1500');
            
                    // Monto disponible en aportaciones 
                    await expect(page.locator('#APORTACIONES\\ PREFERENTES_MONTO_APERTURA_help').filter({hasText: 'Monto disponible en aportaciones es: 2,000.00'})).toBeVisible();
            
                    // Monto maximo de apertura
                    const montoMaximo = page.locator('#APORTACIONES\\ PREFERENTES_MONTO_APERTURA_help').filter({hasText: 'Monto máximo de apertura: 6,000.00'});
                    await expect(montoMaximo).toBeVisible();
            
                    // Subir la imagen de la firma
                    const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
                    await page.getByText('Cargar ').click(); 
                    const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
                    await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo
            
                    // El titulo de cuentas a debitar debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CUENTAS Y MONTOS A DEBITAR'})).toBeVisible();
            
                    // Buscar una cuenta de la persona
                    const campoBuscarCuenta = page.locator('#select-search').last();
                    await campoBuscarCuenta.click();
                    // Elegir la cuenta de ahorros
                    await page.locator('text=AHORROS NORMALES').click();
            
                    // El monto maximo de apertura no debe cambiar
                    await expect(montoMaximo).toBeVisible();
            
                    // Boton Agregar la cuenta
                    const botonAgregar = page.getByRole('button', {name: 'plus Agregar'});
                    await expect(botonAgregar).toBeVisible();
                    // Click al boton 
                    await botonAgregar.click();
            
                    // El monto por defecto es el monto de apertura, clickear en otro lugar para que se guarde el monto
                    await page.locator('text=TOTALES').click();
            
                    // Click en continuar
                    Continuar();
                });
            
                test('Crear cuenta de Aportaciones Preferentes - Paso 2 - Contacto de Firmante', async () => {
                    // Cedula, nombre y apellido de la persona relacionada almacenada en el state
                    const cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                    const nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                    const apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=2`);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Cerrar uno de los mensajes que se muestran
                    await page.locator('[aria-label="close"]').last().click();

                    // Cambiar a la pestaña de Personas o Contactos
                    const seccionPersonaContactos = page.locator('text=Personas o Contactos');
                    await seccionPersonaContactos.click();
            
                    // Titulo de la seccion debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CONTACTOS CON LA PERSONAS O EMPRESA'})).toBeVisible();
            
                    // Regresar a la seccion de firmantes
                    await page.getByRole('tab').filter({hasText: 'Firmantes'}).click();
            
                    // Cerrar uno de los mensajes que aparecen
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
            
                test('Crear cuenta de Aportaciones Preferentes - Paso 3 - Metodo de Interes', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=2`);
            
                    // El titulo debe estar visible
                    await expect(page.locator('text=FORMA PAGO DE INTERESES O EXCEDENTES')).toBeVisible();
                });
            
                test('Finalizar con el registro de cuenta de aportaciones preferentes', async () => {
                    // Boton de Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")');
                    // Esperar que se abra una nueva pestaña
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonFinalizar).toBeVisible(),
                        await botonFinalizar.click()
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
        
                // Cerrar el context
                await context.close();
            });
        });
    }
})