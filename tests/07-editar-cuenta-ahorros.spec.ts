import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables Globales

let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Editar una cuenta de Ahorros para probar el componente de la Firma', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: true,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear la page
        page = await context.newPage();

        // Ir a la URL
        await page.goto(`${url_base}`);
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

        // Seleccionar el tipo de captacion Ahorros Normales
        await page.locator('text=AHORROS NORMALES').click();

        // La URL debe de cambiar al elegir el tipo de captacion
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test('Editar una Cuenta de Ahorros - Datos Generales', async () => {
        // Buscar la cedula de la cuenta de la persona a editar
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        await expect(page.locator(`${cedula}`)).toBeVisible();

        // Click al boton de editar cuenta
        const botonConfirmarTransferencia = page.getByRole('row', {name: `${cedula}`}).getByRole('button', {name: 'edit'});
        await expect(botonConfirmarTransferencia).toBeVisible();
        await botonConfirmarTransferencia.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=1/);

        // El documento de identidad debe ser la cedula guardada en el state
        await expect(page.locator(`text=${cedula}`)).toBeVisible();

        // Editar la descripcion de la cuenta
        const campoDescripcion = page.locator('#AHORROS NORMALES_DESCRIPCION');
        await expect(campoDescripcion).toBeVisible();
        await campoDescripcion.clear();
        await campoDescripcion.fill('CUENTA DE AHORROS');

        // El tipo de captacion debe ser Ahorros Normales
        // await 

        // La categoria debe ser Socio Ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // Editar el monto de confirmacion
        const montoConfirmacion = page.locator('#AHORROS NORMALES_MONTO_CONFIRMACION');
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

        // El boton de Agregar Firmante debe estar visible
        await expect(page.locator('text=Agregar Firmante')).toBeVisible();

        // Click al boton de Continuar
        const botonContinuar = page.locator('button:has-text("Continuar")');
        await expect(botonContinuar).toBeVisible();
        await botonContinuar.click();
    });

    test('Editar una Cuenta de Ahorros - Metodo de Interes', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=3/);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FORMA DE PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

        // Boton Finalizar
        const botonFinalizar = page.locator('button:has-text("Finalizar")')
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Debe regresar a la pagina de inicio de las Cuentas de Ahorros
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});