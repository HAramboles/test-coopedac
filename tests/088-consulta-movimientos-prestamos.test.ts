import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataPrinter, selectBuscar, browserConfig } from './utils/dataTests';
import { formatDate } from './utils/fechas';
import { url_consulta_movimientos_prestamos } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe('Pruebas con la Consulta de los Movimientos de un Prestamo', () => {
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

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Consulta Movimientos Prestamos', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Movimientos Prestamos
        await page.getByRole('menuitem', {name: 'Consulta Movimientos Préstamos'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_prestamos}`);
    });

    test('Buscar el Prestamo de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS PRÉSTAMOS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Prestamo
        await expect(page.locator('#form_PRESTAMOS')).toHaveValue('PRESTAMOS');

        // Cuota
        await expect(page.locator('#form_CUOTA')).toHaveValue('');

        // Balance
        await expect(page.locator('#form_DEUDA_CAPTITAL')).toHaveValue('RD$ 50,000');

        // Moneda
        await expect(page.getByText('PESO (RD)')).toBeVisible();

        // Tasa de Moneda
        await expect(page.locator('#form_TASA_MONEDA')).toHaveValue('RD$ 1');

        // Fecha corte
        await expect(page.locator('#form_FECHA_CORTE')).toHaveValue(`${formatDate(new Date())}`);

        // Estado prestamo
        await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('CANCELADO');
    });

    test('Imprimir los Movimientos del Prestamo', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva ventana con el reporte
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton Imprimir
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close();
    });

    test('Movimientos del Prestamo', async () => {
        // Deben mostrarse los dos movimientos realizados en el prestamo
        await expect(page.getByRole('row', {name: '0', exact: true})).toBeVisible();
        await expect(page.getByRole('row', {name: '1', exact: true})).toBeVisible();

        // Imprimir el primer movimiento
        const imprimirMovimiento1 = page.locator(`${dataPrinter}`).first();
        // Esperar que se abra una nueva ventana con el reporte
        const [pageMovimiento1] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton
            await expect(imprimirMovimiento1).toBeVisible(),
            await imprimirMovimiento1.click()
        ]);

        // Cerrar la pagina
        await pageMovimiento1.close();

        // Debe regresar a la pagina de las consultas
        await expect(page).toHaveURL(`${url_consulta_movimientos_prestamos}`);
        
        // Imprimir el segundo movimiento
        const imprimirMovimiento2 = page.locator(`${dataPrinter}`).last();
        // Esperar que se abra una nueva ventana con el reporte
        const [pageMovimiento2] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton
            await expect(imprimirMovimiento2).toBeVisible(),
            await imprimirMovimiento2.click()
        ]);

        // Cerrar la pagina
        await pageMovimiento2.close();
        
        // Debe regresar a la pagina de las consultas
        await expect(page).toHaveURL(`${url_consulta_movimientos_prestamos}`);

        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS PRÉSTAMOS'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});