import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, selectBuscar, browserConfig } from './utils/dataTests';
import { formatDate } from './utils/fechas';
import { EscenariosPruebaCrearCuentas } from './utils/interfaces';
import { url_cuentas_aportaciones } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Cuenta
let botonNuevaCuenta: Locator;

// Cedula, nombre, apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Creacion de Cuenta de Aportaciones - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPruebaCrearCuentas) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser, con la propiedad headless
                browser = await chromium.launch({
                    headless: browserConfig.headless,
                    args: browserConfig.args
                });
        
                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json',
                });
        
                // Crear una nueva page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
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
        
                // Ingresar a la url de la pagina
                await page.goto(`${url_base}`);

                // Boton de Crear Nueva Cuenta
                botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            });
        
            test('Ir a Apertura de Cuenta de Aportaciones', async () => {
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
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones}/create?step=1`);
                });
            
                test('Registrar Cuenta de Aportaciones - Datos Generales', async () => {            
                    // El titulo de registrar cuenta debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();

                    // Botones con los pasos del formulario
                    await expect(page.getByText('Datos Generales')).toBeVisible();
                    await expect(page.getByText('Firmantes y Contactos')).toBeVisible();
                    await expect(page.getByText('Método de Intereses')).toBeVisible();

                    // El tipo de captacion debe ser Aportaciones
                    await expect(page.locator('#APORTACIONES_ID_TIPO_CAPTACION').nth(1)).toBeVisible();

                    // Numero de cuenta
                    await expect(page.locator('#APORTACIONES_ID_CUENTA')).not.toBeEditable();

                    // Fecha de apertura, debe ser la fecha actual
                    const fechaApetura = page.locator('#APORTACIONES_FECHA_APERTURA');
                    await expect(fechaApetura).toBeDisabled();
                    await expect(fechaApetura).toHaveValue(`${formatDate(new Date())}`);
            
                    // Ingresar el titular
                    const campoTitular = page.locator(`${selectBuscar}`);
                    await campoTitular?.fill(`${cedula}`);
                    // Click a la opcion que coincide con lo buscado
                    await page.locator(`text=${cedula}`).click();
            
                    // El nombre y el apellido de la persona deben aparecer como un titulo
                    await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

                    // Retenciones
                    await expect(page.getByText('RETENCION PERSONA FISICA 10%')).toBeVisible();
            
                    // Seleccionar una categoria
                    const campoCategoria = page.locator('#APORTACIONES_ID_CATEGORIA_SOCIO');
                    await campoCategoria.click();

                    // Las categorias de no aplica, no es socio y de socio pleno no deben mostrarse
                    await expect(page.getByRole('option', {name: 'NO APLICA'})).not.toBeVisible();
                    await expect(page.getByRole('option', {name: 'NO ES SOCIO'})).not.toBeVisible();
                    await expect(page.getByRole('option', {name: 'SOCIO PLENO'})).not.toBeVisible();

                    // Las categorias de socio ahorrante, socio microempresarial, socio empresarial y de socio relacionado deben mostrarse
                    await expect(page.getByRole('option', {name: 'SOCIO MICROEMPRESARIAL'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'SOCIO EMPRESARIAL'})).toBeVisible();
                    await expect(page.getByRole('option', {name: 'SOCIO RELACIONADO'})).toBeVisible();
                    const socioAhorrante = page.getByRole('option', {name: 'SOCIO AHORRANTE'});
                    await expect(socioAhorrante).toBeVisible();

                    // Elegir la categoria de socio ahorrante
                    await socioAhorrante.click();
            
                    // Boton de Continuar
                    const botonContinuar = page.getByRole('button', {name: 'Continuar'});
                    await expect(botonContinuar).toBeVisible();
                    await botonContinuar.click();
                });
            
                test('Registrar Cuenta de Aportaciones - Contacto de Firmante o Persona', async () => {
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

                    // El titular debe estar en la tabla de los firmantes
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
            
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

                    // Click en Cancelar, ya que hay un test exclusivamente para la creacion de cuenta de ahorro
                    await page.getByRole('dialog').getByRole('button', {name: 'No'}).click();
            
                    // Debe redirigirse al listado de las cuentas de aportaciones
                    await expect(page).toHaveURL(`${url_cuentas_aportaciones}`);
                });
            };         
        
            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});

