import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Nombre y apellido del firmante
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Parametros de relation
interface EditarAhorrosParametros {
    ID_OPERACION: '' | 1 | 31
};

const EscenariosPrueba: EditarAhorrosParametros[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 1
    },
    {
        ID_OPERACION: 31
    }
];

// Pruebas

test.describe('Reporte Poder a Terceros - Pruebas con los diferentes parametros', () => {
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
                await page.route(/\/relation/, async (route) => {
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
        
                // Ir a la URL
                await page.goto(`${url_base}`);

                // Cedula, nombres y apellidos de la cuenta de la persona a editar
                cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Nombre y apellido de la persona relacionada almacenada en el state
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
                // Test cuando el ID_OPERACION es Vacio
                test('No debe permitir Entrar a la Edicion de la Cuenta de Ahorros', async () => {            
                    // Buscar al socio a editar
                    await page.locator('#form_search').fill(`${cedula}`);
            
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
            } else if (escenario.ID_OPERACION === 1) {
                // Test cuando el ID_OPERACION es diferente de 31
                test('No debe permitir Entrar a la Edicion de la Cuenta de Ahorros', async () => {
                    // Buscar al socio a editar
                    await page.locator('#form_search').fill(`${cedula}`);
            
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
                // Tests cuando el ID_OPERACION es 31
                test('Datos Generales de la Cuenta de Ahorros', async () => {
                    // Buscar al socio a editar
                    await page.locator('#form_search').fill(`${cedula}`);
            
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
            
                    // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
                    await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();
            
                    // La categoria debe ser Socio Ahorrante
                    await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();
            
                    // El componente de firma debe estar visible y debe ser unico
                    await expect(page.locator('(//div[@class="ant-upload-list-item-container"])')).toBeVisible();
            
                    // Opcion de Firmantes y Contactos
                    const firmantesContactos = page.locator('text=Firmantes y Contactos');
                    await expect(firmantesContactos).toBeVisible();
                    // Click a la opcion
                    await firmantesContactos.click();
                });
            
                test('Cuenta de Ahorros - Contacto de Firmante o Persona - Ver Reporte Poder a Terceros', async () => {            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=2/);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Por lo menos debe estar la firma del titular
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El boton de Agregar Firmante debe estar visible
                    const AgregarFirmante = page.locator('text=Agregar Firmante');
                    await expect(AgregarFirmante).toBeVisible();
            
                    // Boton de imprimir reporte
                    await page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`}).locator('[data-icon="printer"]').click();
            
                    // Debe salir un modal con la opcion de seleccionar un testigo
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
            
                    // Confirmar que se regreso a la pagina anterior
                    await expect(page).toHaveURL(/\/?step=2/);
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Confirmar que el nombre del firmante este visible
                    await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();
            
                    // Click al boton de Cancelar
                    const botonCancelar = page.locator('[id="AHORROS\ NORMALES"]').getByRole('button', {name: 'stop Cancelar'});
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();
            
                    // Click en Aceptar
                    const botonAceptar = page.locator('text=Aceptar');
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();
            
                    // Debe regresar al listado de las cuentas
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
                });
            }        
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();
        
                // Cerrar el context
                await context.close();
            });
        });
    };
});
