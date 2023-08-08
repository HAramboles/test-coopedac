import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedulaMenor: string | null;
let nombreMenor: string | null;
let apellidoMenor: string | null;

// Nombre y apellido del firmante
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Pruebas en el modo solo lectura, para ver una cuenta', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser, con la propiedad headless
        browser = await chromium.launch({
            headless: false,
            args: ['--window-position=-1300,100'],
        });
        
        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la URL de la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombres y apellidos almacenados en el state
        cedulaMenor = await page.evaluate(() => window.localStorage.getItem('cedulaMenor'));
        nombreMenor = await page.evaluate(() => window.localStorage.getItem('nombreMenor'));
        apellidoMenor = await page.evaluate(() => window.localStorage.getItem('apellidoMenor'));

        // Nombre y apellido del firmante
        nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    // Funcion con el boton de siguiente, que se repite en cada seccion del registro
    const Siguiente = async () => {
        // continuar
        const botonSiguiente = page.locator('button:has-text("Siguiente")');
        // presionar el boton
        await botonSiguiente.click();
    };

    test('Ir a la opcion de Apertura de cuentas de Ahorros', async () => {
        // Boton de Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Boton de Apertura de cuentas
        await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();

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

        // Click a la opcion de Ahorros Infantiles
        const opcionAhorrosInfantiles = page.locator('text=AHORROS INFANTILES');
        await expect(opcionAhorrosInfantiles).toBeVisible();
        await opcionAhorrosInfantiles.click();

        // La URL debe de cambiar al elegir el tipo de captacion
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/18`);

        // El tipo de captacion de ahorros infantiles debe estar visible
        await expect(page.locator('#form').getByTitle('AHORROS INFANTILES')).toBeVisible();
    });

    test('Ver cuenta - Datos Generales', async () => {
        // Buscar al socio a editar
        await page.locator(`${formBuscar}`).fill(`${cedulaMenor}`);

        // Click al boton de editar cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombreMenor} ${apellidoMenor}`}).getByRole('button', {name: 'eye'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=1/);

        // El titulo de editar cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CUENTA DE AHORROS'})).toBeVisible();

        // Debe de aparecer el nombre de la persona como titulo
        await expect(page.locator('h1').filter({hasText: `${nombreMenor} ${apellidoMenor}`})).toBeVisible();

        // Descripcion de la cuenta
        const campoDescripcion = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
        await expect(campoDescripcion).toBeVisible();

        // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
        await expect(page.locator('text=AHORROS INFANTILES')).toBeVisible();

        // La categoria debe ser Socio Ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // El tutor del menor debe estar visible
        await expect(page.getByText(`${nombreFirmante} | MADRE`)).toBeVisible();

        // El monto de confirmacion debe estar visible
        await expect(page.getByPlaceholder('MONTO DE CONFIRMACIÓN')).toHaveValue('RD$ 25,000');

        // El componente de firma debe estar visible y debe ser unico
        await expect(page.locator('(//div[@class="ant-upload-list-item-container"])')).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();
    });

    test('Ver cuenta - Contacto de Firmante', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=2/);

        // El titulo de firmantes debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // El boton de Agregar Firmante debe estar visible
        await expect(page.locator('text=Agregar Firmante')).toBeVisible();

        // Nombre del socio
        await expect(page.getByRole('row', {name: `${nombreMenor} ${apellidoMenor}`})).toBeVisible();;

        // Debe estar la firma del titular
        await expect(page.locator('text=TITULAR')).toBeVisible();

        // Nombre del firmante
        await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

        // Debe tener una firma condicional
        await expect(page.locator('text=(O) FIRMA CONDICIONAL')).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();
    });

    test('Ver cuenta - Metodo de Interes', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=3/);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

        // Debe mostrarse el titular de la cuenta
        await expect(page.getByRole('cell', {name: `${nombreMenor} ${apellidoMenor}`})).toBeVisible();

        // Boton Finalizar
        const botonFinalizar = page.locator('button:has-text("Finalizar")')
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Debe regresar a la pagina de inicio de las Cuentas de Ahorros
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/18`);
    });

    test.afterAll(async () => { // despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});