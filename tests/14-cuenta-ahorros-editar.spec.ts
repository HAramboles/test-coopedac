import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, EditarCuentas, ariaCerrar, formBuscar, selectBuscar } from './utils/dataTests';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Cedula, nombre y apellido del firmante
let cedulaFirmante: string | null;
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Parametros de relation

const EscenariosPrueba: EditarCuentas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 31
    }
];

// Pruebas

test.describe('Editar Cuenta de Ahorros - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: false,
                });
        
                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json',
                });
        
                // Crear la page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[34]).length > 1) { 
                        // Reemplazar el body con la response con los datos de los escenario
                        body.data[34] = Object.assign(body.data[34], escenario);
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

                // Cedula, nombres y apellidos de la cuenta de la persona a editar
                cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Cedula, nombre y apellido del firmante
                cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
            });
        
            test('Ir a la opcion de Apertura de cuentas -> Ahorros', async () => {
                // Boton de Captaciones
                await page.locator('text=CAPTACIONES').click();
        
                // Boton de Apertura de cuentas
                await page.locator('text=APERTURA DE CUENTAS').click();
        
                // Boton de Ahorros
                await page.getByRole('menuitem', {name: 'Ahorros'}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros`);
        
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
        
                // Constante con la opcion de ahorros normales
                const tipoAhorros = page.locator('text=AHORROS NORMALES');
        
                if (await tipoAhorros.isHidden()) {
                    // Si no llega el tipo de captacion, manualmente dirigise a la url de los ahorros normales
                    await page.goto(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
                } else if (await tipoAhorros.isVisible()) {
                    // Seleccionar el tipo de captacion Ahorros Normales
                    await page.locator('text=AHORROS NORMALES').click();
                }
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
            });

            if (escenario.ID_OPERACION === '') {
                // Test si el ID_OPERACION es Vacio
                test('No debe permitir Editar la cuenta de ahorros', async () => {            
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // Debe mostrarse un mensaje
                    await expect(page.getByRole('dialog').getByText('No tiene permisos para editar cuentas.')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Skip al test
                    test.skip();
                });
            } else if (escenario.ID_OPERACION === 10) {
                // Test si el ID_OPERACION es diferente de 31
                test('No debe permitir Editar la cuenta de ahorros', async () => {
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // Debe mostrarse un mensaje
                    await expect(page.getByRole('dialog').getByText('No tiene permisos para editar cuentas.')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Skip al test
                    test.skip();
                });
            } else if (escenario.ID_OPERACION === 31) {
                // Tests si el ID_OPERACION es 31
                test('Dirigirse al primer paso de la edicion de cuentas de ahorros', async () => {
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=1/);
            
                    // El titulo de editar cuenta debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();
                });
            
                test('Probar el boton de Cancelar', async () => {
                    // Recargar la pagina
                    await page.reload();
            
                    // Boton de Cancelar
                    const botonCancelar = page.locator('button:has-text("Cancelar")');
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();
            
                    // Modal de confirmacion
                    await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();
                    // Click en Aceptar
                    await page.locator('text=Aceptar').click();
            
                    // Debe redirigirse al listado de las cuentas de ahorros
                    await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
                });
            
                test('Editar Cuenta de Ahorros - Datos Generales', async () => {
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=1/);
            
                    // El titulo de editar cuenta debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();
            
                    // Debe de aparecer el nombre de la persona como titulo
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();
            
                    // Editar la descripcion de la cuenta
                    const campoDescripcion = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
                    await expect(campoDescripcion).toBeVisible();
                    await campoDescripcion.clear();
                    await campoDescripcion.fill('CUENTA AHORRATIVA');
            
                    // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
                    await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();
            
                    // La categoria debe ser Socio Ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();
            
                    // Editar el monto de confirmacion
                    const montoConfirmacion = page.getByPlaceholder('MONTO DE CONFIRMACIÓN');
                    await expect(montoConfirmacion).toBeVisible();
                    await montoConfirmacion.clear();
                    await montoConfirmacion.fill('26,000');
            
                    // El componente de firma debe estar visible y debe ser unico
                    await expect(page.locator('(//div[@class="ant-upload-list-item-container"])')).toBeVisible();
            
                    // Click al boton de Actualizar
                    const botonActualizar = page.locator('button:has-text("Actualizar")');
                    await botonActualizar.click();
                });
            
                test('Editar una Cuenta de Ahorros - Contacto de Firmante o Persona', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=2/);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Por lo menos debe estar la firma del titular
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El boton de Agregar Firmante debe estar visible
                    const AgregarFirmante = page.locator('text=Agregar Firmante');
                    await expect(AgregarFirmante).toBeVisible();
                    
                    // Debe estar la firma del co-propietario
                    await expect(page.locator('text=CO-PROPIETARIO')).toBeVisible();
                });
            
                test('Editar una Cuenta de Ahorros - Eliminar un Firmante', async () => {
                    // Nombre del firmante
                    await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();
                    
                    // Eliminar la firma
                    const eliminarFirma =  page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`}).getByRole('button', {name: 'delete'});
                    // Debe estar visible
                    await expect(eliminarFirma).toBeVisible();
                    // Click al boton
                    await eliminarFirma.click();
            
                    // Debe salir un mensaje de confirmacion
                    await expect(page.locator('text=¿Está seguro de eliminar el registro?')).toBeVisible();
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Debe aparecer un modal para seleccionar el testigo de la eliminacion del firmante
                    await expect(page.getByText('Seleccionar Testigo', {exact: true})).toBeVisible();
            
                    // Seleccionar un testigo
                    await page.locator('#form_ID_TESTIGO').click();
                    // Seleccionar un testigo, la primera opcion que aparezca
                    await page.getByRole('option').nth(0).click();
            
                    // Boton de Imprimir
                    const botonImprimir = page.getByRole('button', {name: 'check Imprimir'});
                    // Esperar que se abra una nueva pestaña con el reporte de poder a terceros
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(botonImprimir).toBeVisible(),
                        await botonImprimir.click()
                    ]);
            
                    // La pagina abierta con el reporte se cierra
                    await newPage.close();
            
                    // El firmante no debe mostrarse luego de la eliminacion del mismo
                    await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).not.toBeVisible();
            
                    // Cerrar uno de los mensajes
                    await page.locator(`${ariaCerrar}`).last().click();
                });
            
                test('Editar una Cuenta de Ahorros - Agregar un Firmante', async () => {
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
                    const botonContinuar = page.locator('button:has-text("Continuar")');
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();
                });
            
                test('Editar una Cuenta de Ahorros - Metodo de Interes', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=3/);
            
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();
            
                    // Boton Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")')
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
            
                    // Debe regresar a la pagina de inicio de las Cuentas de Ahorros
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
                });
            };
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();
            });
        });
    };
});
