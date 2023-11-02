import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, contextConfig } from './utils/dataTests';
import { diaActualFormato } from './utils/fechas';
import { url_cartera_prestamos } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe('Pruebas con la Cartera de Prestamos', () => {
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

    // Funcion para cerrar las paginas que se abren con los diferentes reportes en los pasos de la solicitud de credito
    const CerrarPaginasReportes = async () => {
        context.on('page', async (page) => {
            await page.waitForTimeout(1000);
            await page.close();
        });
    };

    test('Ir a la opcion de Cartera de Prestamos', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Cartera de Prestamos
        await page.getByRole('menuitem', {name: 'Cartera de préstamos'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cartera_prestamos}`);
    });

    test('Imprimir los Prestamos por Cartera', async () => {
        // Titulo principal
        const tituloPrincipal = page.locator('h1').filter({hasText: 'PRÉSTAMOS POR CARTERA'});
        await expect(tituloPrincipal).toBeVisible();

        // Elegir la sucursal
        await page.locator('#form_ID_CENTRO_COSTO').click();
        // Elegir Oficina Principal
        await page.getByRole('option', {name: 'OFICINA PRINCIPAL'}).click();

        // Fecha de corte
        await page.locator('#form_FECHA').fill(`${diaActualFormato}`);

        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pestaña
        await page.waitForTimeout(3000);

        // Esperar que se abra una nueva pestaña con el reporte
        CerrarPaginasReportes();

        // Debe regresar a la ventana anterior
        await expect(tituloPrincipal).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
