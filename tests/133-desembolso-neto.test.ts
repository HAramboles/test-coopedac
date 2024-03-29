import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { diaActualFormato, primerDiaMes } from './utils/functions/fechas';
import { fechaFinal, fechaInicio } from './utils/data/inputsButtons';
import { url_base, url_desembolso_neto } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variabes globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con el Desembolso Neto', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Desembolso Neto', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Desembolso Neto
        await page.getByRole('menuitem', {name: 'Desembolso Neto'}).click();

        // La URL de la pagina debe cambiar
        await expect(page).toHaveURL(`${url_desembolso_neto}`);
    });

    test('Imprimir el Reporte del Desembolso Neto', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'DESEMBOLSO NETO'})).toBeVisible();
        
        // Fecha Inicial
        await expect(page.locator(`${fechaInicio}`)).toHaveValue(`${primerDiaMes}`);

        // Fecha Final
        await expect(page.locator(`${fechaFinal}`)).toHaveValue(`${diaActualFormato}`);

        // Tipo Prestamo
        await expect(page.locator('#form_ID_TIPO_PRESTAMO')).toBeVisible();

        // Oferta
        await expect(page.locator('#form_ID_OFERTA')).toBeVisible();

        // Oficial Cobro
        await expect(page.locator('#form_ID_EJECUTIVO')).toBeVisible();

        // Centro Costo
        await expect(page.locator('#form_ID_CENTRO_COSTO')).toBeVisible();

        // Grupo
        await expect(page.locator('#form_ID_GRUPO')).toBeVisible();

        // Cartera Cobro
        await expect(page.locator('#form_ID_CARTERA')).toBeVisible();

        // Generar Reporte Desembolso Neto
        const generarReporte = page.getByRole('button', {name: 'Generar Reporte'});
        await expect(generarReporte).toBeVisible();
        await generarReporte.click();

        // Esperar que se abra una nueva pagina
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
