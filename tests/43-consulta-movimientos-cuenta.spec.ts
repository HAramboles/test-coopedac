import { Browser, BrowserContext, expect, Page, test, chromium } from '@playwright/test';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pueba con el Historial de los Movimientos de una Cuenta', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Consulta Movimientos Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Movimientos Cuenta
        await page.getByRole('menuitem', {name: 'Consulta Movimientos Cuenta'}).click();
    });

    test.skip('Cuenta de Aportaciones del Socio', async () => {
        // Nombre y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Buscar un socio
        const buscador = page.locator('#select-search');
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('APORTACIONES').last().click();

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('APORTACIONES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirAportaciones = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirAportaciones).toBeVisible(),
            await imprimirAportaciones.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta


        // Balance final
        await expect(page.locator('h1').filter({hasText: 'BALANCE FINAL :'})).toBeVisible();
    });

    test.skip('Cuenta de Aportaciones Preferentes del Socio', async () => {
        // Nombre y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Buscar un socio
        const buscador = page.locator('#select-search');
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('APORTACIONES PREFERENTES').click();

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('APORTACIONES PREFERENTES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirAportacionesPreferentes = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirAportacionesPreferentes).toBeVisible(),
            await imprimirAportacionesPreferentes.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta


        // Balance final
        await expect(page.locator('h1').filter({hasText: 'BALANCE FINAL :'})).toBeVisible();
    });

    test.skip('Cuenta de Ahorros del Socio', async () => {
        // Nombre y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Buscar un socio
        const buscador = page.locator('#select-search');
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('AHORROS NORMALES').click();

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('AHORROS NORMALES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirAhorrosNormales = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirAhorrosNormales).toBeVisible(),
            await imprimirAhorrosNormales.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta


        // Balance final
        await expect(page.locator('h1').filter({hasText: 'BALANCE FINAL :'})).toBeVisible();
    });

    test('Cuenta de Certificados - Financieros Pagaderas del Socio', async () => {
        // Nombre y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Buscar un socio
        const buscador = page.locator('#select-search');
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('FINANCIEROS PAGADERAS').click();

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('FINANCIEROS PAGADERAS');

        // El estado debe estar en Activa
        await expect(page.getByText('CANCELADA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirFinancierosPagaderas = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con el reporte de los movimientos de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirFinancierosPagaderas).toBeVisible(),
            await imprimirFinancierosPagaderas.click()
        ]);

        // Cerrar la pagina con el reporte con todos los movimientos de la cuenta
        await newPage.close();

        // Titulo movimientos de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta, deben de estar los 4 movimientos que se han hecho a la cuenta
        await expect(page.getByText('DEPOSITO INICIAL APERTURA CERTIFICADO FINANCIEROS PAGADERAS')).toBeVisible();
        await expect(page.getByText('INGRESO DE 2050 PESOS A LA CUENTA DE CERTIFICADO')).toBeVisible();
        await expect(page.getByText('DEBITO DE 600 PESOS A LA CUENTA DE CERTIFICADO')).toBeVisible();
        await expect(page.getByText('CANCELACION DE CERTIFICADO')).toBeVisible();

        // Imprimir cada movimiento de la cuenta

        // Movimiento 1
        const movimiento1 = page.getByRole('row', {name: 'DEPOSITO INICIAL APERTURA CERTIFICADO FINANCIEROS PAGADERAS'}).getByRole('button', {name: 'Printer'});
        // Esperar que se abra una nueva pestaña con el reporte del primer movimiento de la cuenta 
        const [movimiento1Page] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(movimiento1).toBeVisible(),
            await movimiento1.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await movimiento1Page.close();

        // Movimiento 2
        const movimiento2 = page.getByRole('row', {name: 'INGRESO DE 2050 PESOS A LA CUENTA DE CERTIFICADO'}).getByRole('button', {name: 'Printer'});
        // Esperar que se abra una nueva pestaña con el reporte del segundo movimiento de la cuenta 
        const [movimiento2Page] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(movimiento2).toBeVisible(),
            await movimiento2.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await movimiento2Page.close();

        // Movimiento 3
        const movimiento3 = page.getByRole('row', {name: 'DEBITO DE 600 PESOS A LA CUENTA DE CERTIFICADO'}).getByRole('button', {name: 'Printer'});
        // Esperar que se abra una nueva pestaña con el reporte del tercer movimiento de la cuenta 
        const [movimiento3Page] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(movimiento3).toBeVisible(),
            await movimiento3.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await movimiento3Page.close();

        // Movimiento 4
        const movimiento4 = page.getByRole('row', {name: 'CANCELACION DE CERTIFICADO'}).getByRole('button', {name: 'Printer'});
        // Esperar que se abra una nueva pestaña con el reporte del cuarto movimiento de la cuenta 
        const [movimiento4Page] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(movimiento4).toBeVisible(),
            await movimiento4.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await movimiento4Page.close();

        // El balance final debe ser 0, ya que la cuenta esta cancelada
        await expect(page.getByRole('row', {name: 'BALANCE FINAL : 0.00'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});