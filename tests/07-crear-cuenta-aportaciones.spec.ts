import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

/* URL de la pagina */
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

test.describe('Pruebas con la Apertura de Cuentas de Aportaciones', () => {
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

        // Ingresar a la url de la pagina
        await page.goto(`${url_base}`);
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const Continuar = async () => {
      // continuar
      const botonContinuar = page.locator('button:has-text("Continuar")');
      // presionar el boton
      await botonContinuar.click();
    };

    test('Ir a Apertura de cuenta de aportaciones', async () => {
        // Captaciones
        await page.locator('text=CAPTACIONES').click();

        // Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Captaciones
        await page.locator('text=Aportaciones').first().click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
    });

    test('Click al boton de Nueva Cuenta', async () => {
        // Boton de Nueva Cuenta
        const botonNuevaCuenta = page.locator('text=Nueva Cuenta');
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1/create?step=1`);
    });

    test('Registrar Cuenta de Aportaciones - Datos Generales', async () => {
        // El titulo de registrar cuenta deb estar visible
        await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();

        // Cedula, nombre y apellido de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Ingresar el titular
        const campoTitular = page.locator('#select-search');
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
    });

    test('Finalizar con el Registro de la Cuenta de Aportaciones', async () => {
        // Boton de finalizar
        const botonFinalizar = page.locator('text=Finalizar');
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();
    
        // Debe de aparecer un modal
        await expect(page.locator('text=¿Desea crear una cuenta de ahorro para este socio?')).toBeVisible();
        // Click en Cancelar, ya que hay un test exclusivamente para la creacion de cuenta de ahorro
        await page.getByRole('dialog').getByRole('button', {name: 'stop Cancelar'}).click();

        // Debe redirigirse al listado de las cuentas de aportaciones
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
