import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, CrearCuentas, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre, apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

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

test.describe('Creacion de Cuenta de Aportaciones - Pruebas con los diferentes parametros', async () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser, con la propiedad headless
                browser = await chromium.launch({
                    headless: false
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

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            });
        
            // Funcion con el boton de continuar, que se repite en cada seccion del registro
            const Continuar = async () => {
              // continuar
              const botonContinuar = page.locator('button:has-text("Continuar")');
              // presionar el boton
              await botonContinuar.click();
            };
        
            test('Ir a Apertura de cuenta de aportaciones', async () => {
                test.slow();
                
                // Captaciones
                await page.locator('text=CAPTACIONES').click();
        
                // Apertura de cuentas
                await page.locator('text=APERTURA DE CUENTAS').click();
        
                // Captaciones
                await page.locator('text=Aportaciones').first().click();
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();

                // Condicion por si el tipo de captacion llega sin datos o con datos
                const tipoCaptacion = page.getByTitle('APORTACIONES', {exact: true});
        
                if (await tipoCaptacion.isHidden()) {
                    // Si no llega el tipo de captacion, manualmente dirigise a la url de las aportaciones
                    await page.goto(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
                } else if (await tipoCaptacion.isVisible()) {
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);

                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();
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
                // Tests si el ID_OPERACION es 30
                test('Click al boton de Nueva Cuenta', async () => {
                    // Boton de Nueva Cuenta
                    const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
                    await expect(botonNuevaCuenta).toBeVisible();
                    await botonNuevaCuenta.click();
            
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1/create?step=1`);
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
                    Continuar();
                });
            
                test('Registrar Cuenta de Aportaciones - Contacto de Firmante o Persona', async () => {
                    // El titulo de firmantes debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
            
                    // Se debe mostrar la fima del titular por defecto
                    await expect(page.locator('text=TITULAR')).toBeVisible();
            
                    // El tipo de firma requerida debe estar visible
                    await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();
            
                    // Boton de Continuar
                    Continuar();
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
                    await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
                });
            };         
        
            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la page
                await page.close();
            });
        });
    };
});

