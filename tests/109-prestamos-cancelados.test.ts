import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, fechaInicio, fechaFinal } from './utils/dataTests';
import { formatDate, diaAnterior } from './utils/fechas';
import { url_prestamos_cancelados } from './utils/urls';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas

test.describe.serial('Pruebas con el Reporte de Prestamos Cancelados', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
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

        // Ir a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Pestamos Cancelados', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'Negocios'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'Consultas'}).click();

        // Prestamos Cancelados
        await page.getByRole('menuitem', {name: 'Préstamos Cancelados'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_prestamos_cancelados}`);
    });

    test('Generar el reporte de Prestamos Cancelados', async () => {
        // EL titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'PRÉSTAMOS CANCELADOS'})).toBeVisible();

        // Seccion criterios de busqueda
        await expect(page.locator('text=Criterio de búsqueda')).toBeVisible();

        // Fecha inicial
        await page.locator(`${fechaInicio}`).fill(`${diaAnterior}`);

        // Fecha final
        await page.locator(`${fechaFinal}`).fill(`${formatDate(new Date())}`);

        // Click al boton de Generar Reporte
        await page.getByRole('button', {name: 'Generar Reporte'}).click();

        // Debe abrirse una nueva pestaña con el reporte de Prestamos Cancelados
        const page1 = await context.waitForEvent('page');

        // Esperar que el reporte este visible
        await page1.waitForTimeout(8000);

        // Cerrar la pagina con el reporte
        await page1.close();

        // Debe regresar a la pagina de Prestamos Cancelados
        await expect(page.locator('h1').filter({hasText: 'PRÉSTAMOS CANCELADOS'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();

    });
});
