import { APIResponse, Browser, BrowserContext, chromium, Page, expect, Locator, test } from '@playwright/test';
import { url_base, formBuscar, selectBuscar, browserConfig } from './utils/dataTests';
import { EscenariosPruebaEditarCuentas } from './utils/interfaces';
import { url_cuentas_certificados, url_cuentas_certificados_financieros_reinvertidas } from './utils/urls';

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
let cedulaFirmante: string | null;
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Editar Cuenta de Certificado Financieros Reinvertidas', async () => {
    for (const escenario of EscenariosPruebaEditarCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
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

                // Cedula, nombre y apellido del firmante almacenada en el state
                cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

                // Boton de Editar Cuentas
                botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
            });

            test('Ir a la opcion de Apertura de cuentas de Certificados', async () => {
                // Boton de Captaciones
                await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
                // Boton de Apertura de cuentas
                await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();
        
                // Boton de Certificados
                await page.getByRole('menuitem', {name: 'Certificados', exact: true}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_cuentas_certificados}`);
        
                // El titulo de Certificadoss debe estar visible
                await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();
            });
        
            test('Seleccionar el Certificado Financieros Reinvertidas', async () => {
                // El titulo de tipo de captaciones debe estar visible
                await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();
        
                // Boton de seleccionar captaciones
                const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
                await expect(botonCaptaciones).toBeVisible();
                // Click al boton
                await botonCaptaciones.click();

                // Click a la opcion de Financieros Reinvertidas
                const opcionFinancierosReinvertidas = page.locator('text=FINANCIEROS REINVERTIDAS');
                await expect(opcionFinancierosReinvertidas).toBeVisible();
                await opcionFinancierosReinvertidas.click();
        
                // La URL debe de cambiar al elegir el tipo de captacion
                await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_reinvertidas}`);

                // El tipo de captacion de Financieros Reinvertidas debe estar visible
                await expect(page.locator('#form').getByTitle('FINANCIEROS REINVERTIDAS')).toBeVisible();
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
                test('Dirigirse al primer paso de la edicion de Cuentas de Certificados Financieros Reinvertidas', async () => {
                    // Buscar al socio a editar
                    await page.locator(`${formBuscar}`).fill(`${cedula}`);
            
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // Esperar cinco segundos
                    await page.waitForTimeout(5000);
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=1/);
            
                    // El titulo de editar cuenta debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE CERTIFICADOS'})).toBeVisible();
                });

                test('Editar Cuenta de Certificados Financieros Reinvertidas - Datos Generales', async () => {
                    // Esperar que la pagina cargue
                    await page.waitForLoadState('networkidle');
                
                    // Esperar que carguen los datos
                    await page.waitForTimeout(4000);

                    // Tipo Captacion
                    await expect(page.getByTitle('FINANCIEROS REINVERTIDAS').first()).toBeVisible();

                    // Retenciones
                    await expect(page.getByTitle('RETENCION PERSONA FISICA 10%')).toBeVisible();

                    // Descripcion de Cuenta
                    const descripcion = page.locator('#FINANCIEROS\\ REINVERTIDAS_DESCRIPCION');
                    await expect(descripcion).toHaveValue('FINANCIEROS REINVERTIDAS');

                    // Titular
                    await expect(page.getByTitle(`${nombre} ${apellido}`)).toBeVisible();

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

                    // Categoria
                    await expect(page.getByTitle('SOCIO AHORRANTE')).toBeVisible();

                    // Monto de Apertura
                    await expect(page.locator('#FINANCIEROS\\ REINVERTIDAS_MONTO_APERTURA')).toHaveValue('RD$ 50');

                    // Tasa Anual
                    await expect(page.locator('#FINANCIEROS\\ REINVERTIDAS_TASA')).toHaveValue('8%');

                    // Plazo
                    await expect(page.locator('#FINANCIEROS\\ REINVERTIDAS_PLAZO')).toHaveValue('36');

                    // Origen de Inversion
                    await expect(page.locator('h1').filter({hasText: 'ORIGEN DE INVERSIÓN'})).toBeVisible();

                    // Cuenta de origen de inversion
                    await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Click al boton de Actualizar
                    const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
                    await expect(botonActualizar).toBeVisible();
                    await botonActualizar.click();
                });

                test('Editar Cuenta de Certificados Financieros Reinvertidas - Firmantes y Contactos', async () => {
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

                test('Editar Cuenta de Certificados Financieros Reinvertidas - Metodo de Intereses', async () => {
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=3/);
            
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

                    // Debe mostrarse la cuenta donde se va a depositar 
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Debe mostrarse el valor a depositar en la cuenta
                    await expect(page.getByRole('cell', {name: '100', exact: true})).toBeVisible(); 
                });

                test('Editar Cuenta de Certificados Financieros Reinvertidas - Metodo de Intereses - Distribucion de Intereses', async () => {
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

                test('Finalizar con la Edicion de la Cuenta de Certificados Financieros Pagaderas', async () => {
                    // Boton Finalizar
                    const botonFinalizar = page.locator('button:has-text("Finalizar")')
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
            
                    // Debe regresar a la pagina de inicio de las Cuentas de Certificados Financieros Reinvertidos
                    await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_reinvertidas}`);
                });

                test('Las opciones con los tipos de captacion deben estar visibles', async () => {
                    // Click al selector de tipos captacion
                    await expect(page.locator('#form').getByTitle('FINANCIEROS REINVERTIDAS')).toBeVisible();
                    await page.locator('#form').getByTitle('FINANCIEROS REINVERTIDAS').click();

                    // Todos los tipos de captacion deben estar visibles
                    await expect(page.getByRole('option', {name: 'FINANCIEROS PAGADERAS'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'FINANCIEROS REINVERTIDAS'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'INVERSION PAGADERAS'})).toBeVisible();
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
