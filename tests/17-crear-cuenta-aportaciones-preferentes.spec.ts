import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con la Apertura de Cuentas de Aportaciones Preferentes', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: true
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const Continuar = async () => {
        // continuar
        const botonContinuar = page.locator('button:has-text("Continuar")');
        // presionar el boton
        await botonContinuar.click();
    };

    test('Ir a la opcion de Aportaciones Preferentes', async () => {
        // Captaciones
        await page.locator('text=CAPTACIONES').click();

        // Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Captaciones
        await page.getByRole('menuitem', {name: 'Aportaciones Preferentes', exact: true}).click();
    });

    test('Click al boton de Nueva Cuenta', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);

        // El titulo debe estar presente
        await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();

        // Nueva Cuenta
        const botonNuevaCuenta = page.getByRole('button', {name: 'Nueva Cuenta'});
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();
    });

    test('Crear cuenta de Aportaciones Preferentes - Paso 1 - Datos Generales', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=1`);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();

        // El titulo de la seccion debe estar visible
        await expect(page.locator('text=Datos Generales')).toBeVisible();

        // Cedula de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        // Buscar un socio
        await page.locator('#select-search').fill(`${cedula}`);
        // Click al socio
        await page.locator(`text=${cedula}`).click();

        // Cambiar al descripcion de la cuenta
        const descripcion = page.locator('#APORTACIONES\\ PREFERENTES_DESCRIPCION');
        await descripcion.fill('Cuenta de Aportaciones Preferentes');

        // La categoria debe ser de socio ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // Ingresar un monto inicial
        
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerra la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});