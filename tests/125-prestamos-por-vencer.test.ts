import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate, diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { url_base, url_prestamos_por_vencer } from './utils/dataPages/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con los Prestamos por Vencer', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Prestamos por Vencer', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Prestamos por vencer
        await page.getByRole('menuitem', {name: 'Prestamos por vencer'}).click();

        // La URL de la pagina debe cambiar
        await expect(page).toHaveURL(`${url_prestamos_por_vencer}`);
    });

    test('Imprimir todos los prestamos por vencer', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'PRÉSTAMOS POR VENCER'})).toBeVisible();

        // La fecha de fin debe ser la fecha actual
        await expect(page.getByPlaceholder('Fecha Final')).toHaveValue(`${diaActualFormato}`);

        // Imprimir los prestamos por vencer
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Click al boton de Finalizar
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pagina
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte con los movimientos
        await page1.close();
    });

    test('Cambiar fechas', async () => {
        // Cambiar fecha de inicio
        const fechaInicio = page.getByPlaceholder('Fecha Inicial');
        await fechaInicio.clear();
        await fechaInicio.fill('26/03/2023')

        // Restarle un dia a la fecha actual
        const dia = new Date();
        dia.setDate(dia.getDate() - 2);
        /* setDate = cambiar el dia del mes. getDate = Devuelve un numero del dia del mes entre 1 y 31. 
        A la fecha actual se cambia el dia del mes por el dia devuelto por getDate menos 2 */
        const diaAnterior = formatDate(dia);

        // Cambiar fecha final
        const fechaFinal = page.getByPlaceholder('Fecha Final');
        await fechaFinal.clear();
        await fechaFinal.fill(`${diaAnterior}`);

        // Boton de buscar
        const botonBuscar = page.locator('[aria-label="search"]');
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Imprimir los prestamos por vencer
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Click al boton de Finalizar
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pagina
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte con los movimientos
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();
        
        // Cerrar la page
        await page.close();
    });
});