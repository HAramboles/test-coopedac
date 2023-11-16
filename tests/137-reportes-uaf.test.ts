import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { selectBuscar, fechaFinal, fechaInicial, dataPrinter } from './utils/data/inputsButtons';
import { url_base, url_reportes_uaf } from './utils/dataPages/urls';
import { diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Historico del Reporte de UAF', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crea el browser
        browser = await chromium.launch(browserConfig);

        // Crea el contexto
        context = await browser.newContext(contextConfig);

        // Crea la page
        page = await context.newPage();

        // Dirigirse a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la pagina de Reportes UAF', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Reportes UAF
        await page.getByRole('menuitem', {name: 'Reportes UAF'}).click();

        // La URL debe cambiar
        await page.goto(`${url_reportes_uaf}`)
    });
    
    test('Buscar a la persona que genero el reporte RTE', async () => {
        // EL titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REPORTES UAF'})).toBeVisible();

        // Seccion criterio de busqueda

        // Buscar a la persona
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la opcion de la persona
        await page.getByRole('option', {name: `${nombre} ${apellido}`}).click();

        // Sucursal
        await expect(page.getByLabel('Sucursal')).toBeVisible();
        await expect(page.getByTitle('TODOS')).toBeVisible();

        // Caja
        await expect(page.getByLabel('Caja')).toBeVisible();
        await expect(page.getByTitle('TODAS')).toBeVisible();

        // Fecha Inicial
        await expect(page.locator(`${fechaInicial}`)).toHaveValue(`${diaActualFormato}`);

        // Fecha Final
        await expect(page.locator(`${fechaFinal}`)).toHaveValue(`${diaActualFormato}`);

        // Click al boton de buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Reimprimir el reporte RTE de la persona buscada', async () => {
        // Debe mostrarse el reporte de la persona
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`}).first()).toBeVisible();

        // Imprimir el reporte RTE
        await page.getByRole('row', {name: 'RD$ 2,000,000.00'}).locator(`${dataPrinter}`).click();

        // Esperar a que se abra una nueva pestaña con el reporte RTE
        const page1 = await context.waitForEvent('page');

        // Cerrar la nueva pestaña
        await page1.close(); 

        // Debe regresar a la pagina de Historico de Caja
        await expect(page).toHaveURL(`${url_reportes_uaf}`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
