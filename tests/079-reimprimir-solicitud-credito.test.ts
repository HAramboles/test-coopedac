import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';
import { url_base, formBuscar, browserConfig } from './utils/dataTests';
import { url_reimprimir_solicitud_credito } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Prueba con la Reimpresion de la Solicitud de Credito', () => {
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

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Reimpresion de Solicitud de Credito', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Solicitudde Credito
        await page.getByRole('menuitem', {name: 'Reimprimir Solicitud de Crédito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_solicitud_credito}`);
    });

    test('Buscar un socio', async () => {
        // El titulo debe estar presente
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR SOLICITUD DE CRÉDITO'})).toBeVisible();

        // Ingresar un socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
    });

    test('Reimprimir el Credito Hipotecario Desembolsado', async () => {
        // Se debe mostrar el credito hipotecario en estado desembolsado
        await expect(page.locator('text=DESEMBOLSADO').first()).toBeVisible();

        // Reimprimir Credito
        const botonReimprimir = page.getByRole('row', {name: 'DESEMBOLSADO'}).locator('[aria-label="file-text"]');
        await expect(botonReimprimir).toBeVisible();
        await botonReimprimir.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Esperar que se cargue el reporte
        await page1.waitForTimeout(4000);
        
        // Cerrar la pagina con el reporte 
        await page1.close();

        // Debe volver a la pagina de la reimpresiones
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR SOLICITUD DE CRÉDITO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
