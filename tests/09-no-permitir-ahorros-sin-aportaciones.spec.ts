import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('No permitir la Creacion de una Cuenta de Ahorros sin crear una de Aportaciones', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
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

    test('Ir a la opcion de Crear Cuenta de Ahorros', async () => {
        // Captaciones
        await page.getByRole('menuitem').filter({hasText: 'CAPTACIONES'}).click();

        // Apertura de Cuentas
        await page.getByRole('menuitem').filter({hasText: 'APERTURA DE CUENTAS'}).click();

        // Ahorros
        await page.getByRole('menuitem').filter({hasText: 'Ahorros'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros`);

        // El titulo de ahorros debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
    });

    test ('Debe aparecer un mensaje de error si se le da click a Nueva Cuenta sin elegir una tipo de captacion', async () => {
        // Boton de Nueva Cuenta
        const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();

        // Mensaje de error
        await expect(page.locator('text=No ha seleccionado un tipo de captación.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();
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
            // Recargar la pagina
            await page.reload();
            // Seleccionar el tipo de captacion Ahorros Normales
            await botonCaptaciones.click();
            await page.locator('text=AHORROS NORMALES').click();
        } else if (await tipoAhorros.isVisible()) {
            // Seleccionar el tipo de captacion Ahorros Normales
            await page.locator('text=AHORROS NORMALES').click();
        }

        // La URL debe de cambiar al elegir el tipo de captacion
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });
    
    test('Click al boton de Nueva Cuenta', async () => {
        // Boton de Nueva Cuenta
        const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16/create?step=1`);

        // El titulo de Registrar Cuenta debe estar visible
        await expect(page.locator('text=CREAR CUENTA DE AHORROS')).toBeVisible();
    });

    test('Ingresar un socio para crear una cuenta de ahorros', async () => {
        // Cedula de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        // Titular
        const campoTitular = page.locator('#select-search');

        await campoTitular?.fill(`${cedula}`);
        // Seleccionar la opcion que aparece
        await page.locator(`text=${cedula}`).click();

        // Debe salir un mensaje de aviso
        await expect(page.locator('text=Para continuar, debe crear una cuenta de APORTACIONES a este socio.')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se debe redirigir a la pagina de las cuentas de ahorros
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
