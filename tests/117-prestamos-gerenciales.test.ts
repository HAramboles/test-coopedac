import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate, primerDiaMes } from './utils/fechas';
import { url_base, browserConfig, fechaInicio, fechaFinal, contextConfig } from './utils/dataTests';
import { url_prestamos_gerenciales } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con la Impresion de Prestamos Gerenciales', () => {
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

    test('Ingresar a la opcion de Prestamos Gerenciales', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Prestamos Gerenciales
        await page.getByRole('menuitem', {name: 'Préstamos Gerenciales'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_prestamos_gerenciales}`);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'Préstamos Gerenciales'})).toBeVisible();
    });

    test('Modificar las opciones para Prestamos Hipotecarios', async () => {
        // El estado de los prestamos debe estar en desembolsado
        await expect(page.getByText('DESEMBOLSADO')).toBeVisible();

        // Tipo Prestamo
        const tipoPrestamo = page.locator('(//SPAN[@class="ant-select-selection-item"][text()="PRESTAMOS PERSONALES"])');
        await expect(tipoPrestamo).toBeVisible();
        await tipoPrestamo.click();
        // Elegir el tipo de prestamo hipotecario
        await page.getByText('PRESTAMOS HIPOTECARIOS').click();

        // Tipo Garantia
        await expect(page.getByText('TODOS').first()).toBeVisible();
        // Cambiar el tipo de garantia
        await page.locator('(//DIV[@class="ant-select-selector"])[3]').click();
        // Elegir el tipo de garantia hipotecaria
        await page.getByText('HIPOTECARIAS').click();

        // Oferta
        await page.locator('(//DIV[@class="ant-select-selector"])[4]').click();
        // Elegir la oferta hipotecaria
        await page.getByText('CRÉDITO HIPOTECARIO').click();

        // Grupos
        const grupos = page.locator('#form_ID_GRUPO');
        // await grupos.click();
        await grupos.fill('SIN GA')
        // Elegir el grupo sin garantia
        await page.getByText('SIN GARANTIA', {exact: true}).click();

        // Monto inicial
        await expect(page.locator('#form_MONTO_INICIAL')).toHaveValue('RD$ 0');

        // Monto final
        await expect(page.locator('#form_MONTO_FINAL')).toHaveValue('RD$ 1,000,000');

        // Fecha Desembolso Inicial
        const fechaInicial = page.locator(`${fechaInicio}`);
        await fechaInicial.clear();
        // Ingresar la fecha de inicio del mes
        await fechaInicial.fill(`${primerDiaMes}`);

        // Fecha Desembolso Final
        const fechaFin = page.locator(`${fechaFinal}`);
        await fechaFin.clear();
        // Colocar la fecha actual
        await fechaFin.fill(`${formatDate(new Date())}`);

        // Centro Costos
        await expect(page.getByText('OFICINA PRINCIPAL', {exact: true})).toBeVisible();

        // Boton Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Imprimir los Prestamos Hipotecarios', async () => {
        // Generar Reporte 
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

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
