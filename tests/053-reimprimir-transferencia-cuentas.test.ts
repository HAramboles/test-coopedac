import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate, primerDiaMes } from './utils/fechas';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Reimpresion de la Transferencia entre Cuentas Internas', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
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

        // URL de la pagina
        await page.goto(`${url_base}`);

        // Nombres y apellidos de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ingresar a la Reimprimision de Transferencia entre Cuentas', async () => {
        // Captaciones
        await page.getByRole("menuitem", {name: 'CAPTACIONES'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir transferencia entre cuentas
        await page.getByRole('menuitem', {name: 'Reimprimir transferencia entre cuentas'}).click();
        
        // La URL de la pagina debe cambiar
        await expect(page).toHaveURL(`${url_base}/reimp_transferencias_cuentas/01-2-6-2/`);
    });

    test('Buscar las cuentas de un Socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR TRANSFERENCIA ENTRE CUENTAS'})).toBeVisible();

        // Criterios de Busqueda
        await expect(page.getByText('Criterios de Búsqueda')).toBeVisible();

        // Fecha Inicial
        await page.locator('#form_FECHA_INICIAL').fill(`${primerDiaMes}`);

        // Fecha Final
        await page.locator('#form_FECHA_FINAL').fill(`${formatDate(new Date())}`);

        // Buscar la cuenta de origen del socio
        await page.locator(`${selectBuscar}`).first().fill(`${nombre} ${apellido}`);
        // Elegir la cuenta de ahorros del socio
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Buscar la cuenta de destino del socio
        await page.locator(`${selectBuscar}`).last().fill(`${nombre} ${apellido}`);
        // Elegir la cuenta de aportaciones del socio
        await page.getByRole('option', {name: '| APORTACIONES |'}).nth(1).click();

        // Click en buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Reimprimir la Transferencia entre Cuentas del Socio', async () => {
        // Imprimir el contrato
        const botonImprimir = page.getByRole('row', {name: 'APORTACIONES'}).getByRole('button', {name: 'Printer'});
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});