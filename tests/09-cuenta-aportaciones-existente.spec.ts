import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

/* URL de la pagina */
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('No permitir crear otra Cuenta de Aportaciones del mismo Socio', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser, con la propiedad headless
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la url de la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a Apertura de cuenta de aportaciones', async () => {
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
            await page.reload();
        } else if (await tipoCaptacion.isVisible()) {
            // La URL debe de cambiar
            await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
        }
    });

    test('Click al boton de Nueva Cuenta', async () => {
        // Boton de Nueva Cuenta
        const botonNuevaCuenta = page.locator('text=Nueva Cuenta');
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1/create?step=1`);
    });

    test('Debe de salir un modal avisando que el titular ya tiene una cuenta de aportaciones', async () => {
        // Cedula de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        // El titulo de registrar cuenta deb estar visible
        await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();

        // Ingresar el titular
        const campoTitular = page.locator('#select-search');

        await campoTitular?.fill(`${cedula}`);
        // Click a la opcion que coincide con lo buscado
        await page.locator(`text=${cedula}`).click();

        // El modal debe de salir, luego de ingresar el titular
        const modal = page.locator('text=Este cliente ya posee una cuenta de este tipo captación.');
        await expect(modal).toBeVisible();

        // Aceptar y regresar a la pagina de aportaciones
        const botonAceptar = page.locator('text=Aceptar');
        await botonAceptar.click();

        // El modal debe desaparecer
        await expect(modal).not.toBeVisible();

        // Debe regresar atras y la URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});