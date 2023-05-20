import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas

test.describe('Pruebas con la Cartera de Cuentas', async () => {
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

    test('Ir a la opcion de Cartera de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();
        
        // Cartera de Cuentas
        await page.getByRole('menuitem', {name: 'Cartera de cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cartera_cuentas/01-2-4-15/`);
    });

    test('Cambiar los datos de la Cartera de Cuentas', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CARTERA DE CUENTAS'})).toBeVisible();

        // Sucursal
        await page.locator('.ant-select-selector').first().click();
        // Elegir Oficina Principal
        await page.getByText('OFICINA PRINCIPAL', { exact: true }).click();

        // Clase Captacion
        await page.locator('((//SPAN[@class="ant-select-selection-item"][text()="TODAS"])[2])').click();
        // Elegir Aportaciones
        await page.getByText('APORTACIONES', {exact: true}).click();

        // Tipo Captacion
        await page.locator('#form div').filter({hasText: /^TODAS$/}).nth(4).click();
        // Elegir Aportaciones
        await page.getByRole('option', {name: 'APORTACIONES', exact: true}).click();

        // Fecha Corte, debe tener la fecha atual
        await expect(page.locator('#form_FECHA')).toHaveValue(`${formatDate(new Date())}`);

        // Estados
        await page.locator('((//DIV[@class="ant-select-selector"])[4])').click();
        // Elegir Activas
        await page.getByText('ACTIVA', {exact: true}).click();
    });

    test('Imprimir la Cartera de Cuentas', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra otra ventana con el reporte
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Imprimir
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
