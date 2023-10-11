import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base, browserConfig, userCorrecto } from './utils/dataTests';
import { formatDate } from './utils/fechas';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Usuario
let botonUsuario: Locator;

// Pruebas
test.describe.serial('Pruebas Cerrando la Sesion', async () => {
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

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Boton de Usuario
        botonUsuario = page.locator('[data-icon="user"]');
    });

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.CRITICAL);
    });

    test('Header de la pagina', async () => {
        // La fecha del dia debe estar visible en el header
        await expect(page.getByText(`${formatDate(new Date())}`)).toBeVisible();

        // El nombre del usuario debe estar visible en el header
        await expect(page.locator('span').filter({hasText: `${userCorrecto}`})).toBeVisible();

        // Boton de Inicio del Header
        await expect(page.locator('[aria-label="home"]')).toBeVisible();

        // Boton de Usuario en el header
        await expect(botonUsuario).toBeVisible();
    });

    test('Cerrar la Sesion', async () => {
        // Click al boton de usuario
        await botonUsuario.click();

        // Click al boton de cerrar sesion
        await page.click('text=Cerrar Sesión');
        
        // Aparece un modal de confirmacion
        await expect(page.locator('text=¿Seguro que deseas cerrar sesión?')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe regresar al login
        await expect(page).toHaveURL(`${url_base}/login`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
