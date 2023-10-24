import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, formBuscar, browserConfig, contextConfig } from './utils/dataTests';
import { EscenariosPruebaEditarCuentas } from './utils/interfaces';
import { url_cuentas_aportaciones_preferentes } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Editar
let botonEditarCuenta: Locator;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Cedula, nombre y apellido del firmante
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Editar Cuenta de Aportaciones Preferentes', async () => {
    for (const escenario of EscenariosPruebaEditarCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);

                // Crear el context
                context = await browser.newContext(contextConfig);

                // Crear una page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[34]).length > 1) {
                        // Reemplazar el body con la response con los datos del escenario
                        body.data[34] = Object.assign(body.data[34], escenario);
                        await route.fulfill({
                            response, 
                            body: JSON.stringify(body)
                        });
                    } else {
                        route.continue();
                    }
                });

                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Nombre y apellido del firmante almacenada en el state
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

                // Boton de Editar Cuentas
                botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
            });

            test('Ir a Apertura de Cuenta de Aportaciones', async () => {
                // Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Captaciones
                await page.getByRole('menuitem', {name: 'Aportaciones Preferentes'}).first().click();

                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_cuentas_aportaciones_preferentes}`);
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
            });

            if (escenario.ID_OPERACION !== 31) {
                // Test si el ID_OPERACION es diferente de 31
                test('No debe permitir Editar la cuenta de ahorros', async () => {            
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // Debe mostrarse un mensaje
                    const mensajeError = page.getByRole('dialog').getByText('No tiene permisos para editar cuentas.')
                    await expect(mensajeError).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // El mensaje debe desaparecer
                    await expect(mensajeError).not.toBeVisible();
                });
            } else if (escenario.ID_OPERACION === 31) {
                // Tests si el ID_OPERACION es 31
                test('Dirigirse al primer paso de la edicion de Cuentas de Aportaciones Preferentes', async () => {
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=1/);

                    // Esperar a que el servicio de busqueda de personas cargue
                    await page.waitForResponse('**/persona/personas?page=1&size=15');
                    await page.waitForTimeout(3000);
            
                    // El titulo de editar cuenta debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();
                });

                test('Editar Cuenta de Aportaciones Preferentes - Datos Generales', async () => {               
                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);

                    // Tipo Captacion
                    await expect(page.getByTitle('APORTACIONES PREFERENTES').first()).toBeVisible();

                    // Retenciones
                    await expect(page.getByTitle('RETENCION PERSONA FISICA 10%')).toBeVisible();

                    // Descripcion de Cuenta
                    const descripcion = page.locator('#APORTACIONES\\ PREFERENTES_DESCRIPCION');
                    await expect(descripcion).toHaveValue('APORTACIONES PREFERENTES');

                    // Titular
                    await expect(page.getByTitle(`${nombre} ${apellido}`)).toBeVisible();

                    // Categoria
                    await expect(page.getByTitle('SOCIO AHORRANTE')).toBeVisible();

                    // Monto de Apertura
                    await expect(page.locator('#APORTACIONES\\ PREFERENTES_MONTO_APERTURA')).toHaveValue('RD$ 100');

                    // Tasa Anual
                    await expect(page.locator('#APORTACIONES\\ PREFERENTES_TASA')).toHaveValue('5%');

                    // Plazo
                    await expect(page.locator('#APORTACIONES\\ PREFERENTES_PLAZO')).toHaveValue('24');

                    // Origen de Inversion
                    await expect(page.locator('h1').filter({hasText: 'ORIGEN DE INVERSIÓN'})).toBeVisible();

                    // Cuenta de origen de inversion
                    await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Boton de Actualizar
                    const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
                    await expect(botonActualizar).toBeVisible();

                    // Click al boton de Actualizar
                    await page.getByRole('button', {name: 'Omitir'}).click();
                });

                test('Editar Cuenta de Aportaciones Preferentes - Firmantes y Contactos', async () => {
                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);
                    
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=2/);
            
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // La firma del titular debe estar visible
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
            
                    // Se debe mostrar la firma del titular por defecto
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El tipo de firma requerida debe estar visible
                    await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();

                    // La firma del copropietario debe estar visible
                    await expect(page.getByRole('cell', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

                    // Se debe mostrar la firma del copropietario 
                    await expect(page.locator('text=CO-PROPIETARIO')).toBeVisible();

                    // El tipo de firma condicional debe estar visible
                    await expect(page.locator('text=(O) FIRMA CONDICIONAL')).toBeVisible();

                    // Boton de Guardar y Continuar
                    const botonGuardaryContinuar = page.getByRole('button', {name: 'Guardar y continuar'});
                    await expect(botonGuardaryContinuar).toBeVisible();
                    await botonGuardaryContinuar.click();
                });

                test('Editar Cuenta de Aportaciones Preferentes - Metodo de Intereses', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=3/);
            
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta donde se va a depositar 
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Debe mostrarse el valor a depositar en la cuenta
                    await expect(page.getByRole('cell', {name: '100', exact: true})).toBeVisible(); 
                });

                test('Finalizar con la Edicion de la Cuenta de Aportaciones Preferentes', async () => {
                    // Boton Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")')
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
            
                    // Debe regresar a la pagina de inicio de las Cuentas de Aportaciones Preferentes
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones_preferentes}`);
                });
            };

            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la pagina
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});
