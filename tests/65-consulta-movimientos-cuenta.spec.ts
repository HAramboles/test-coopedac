import { Browser, BrowserContext, expect, Locator, Page, test, chromium } from '@playwright/test';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Variable con el input para buscar los socios 
let buscador: Locator;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

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

        // Nombre y apellido de la persona almacenados en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Input para buscar las cuentas del socio
        buscador = page.locator('#select-search');
    });

    test('Ir a la opcion de Consulta Movimientos Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Movimientos Cuenta
        await page.getByRole('menuitem', {name: 'Consulta Movimientos Cuenta'}).click();
    });

    test('Cuenta de Aportaciones del Socio', async () => {
        // Buscar un socio
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('| APORTACIONES |').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('APORTACIONES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta de Aportaciones
        const imprimirAportaciones = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con el estado de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Imprimir
            await expect(imprimirAportaciones).toBeVisible(),
            await imprimirAportaciones.click()
        ]);

        // Cerrar la pagina con la el reporte del estado de la cuenta
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta
        await expect(page.getByText('DEPOSITO DE 2000 PESOS A LA CUENTA DE APORTACIONES')).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES')).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 3,000.00' })).toBeVisible();

        // Se debe regresar a la pagina de los movimientos de la cuenta
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();
    });

    test('Cuenta de Aportaciones Preferentes del Socio', async () => {
        // Buscar una cuenta del mismo socio
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('APORTACIONES PREFERENTES').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('APORTACIONES PREFERENTES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirAportacionesPreferentes = page.getByRole('button', {name: 'Imprimir'});
        // Imprimir los movimientos de la cuenta de Aportaciones Preferentes 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirAportacionesPreferentes).toBeVisible(),
            await imprimirAportacionesPreferentes.click()
        ]);

        // Cerrar la pagina con el reporte del estado de la cuenta
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta
        await expect(page.getByText('DEPOSITO INICIAL APERTURA CERTIFICADO APORTACIONES PREFERENTES')).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES PREFERENTES (FINANZAS)')).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 2,500.00' })).toBeVisible();
    });

    test('Cuenta de Ahorros Normales del Socio', async () => {
        // Buscar una cuenta del mismo socio
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Ahorros del Socio
        await page.getByText('AHORROS NORMALES').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

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
        await expect(page.getByText('DEPOSITO DE 2000 PESOS A LA CUENTA DE AHORROS')).toBeVisible();
        await expect(page.getByText('RETIRO DE 100 PESOS DE LA CUENTA DE AHORROS')).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA BANCARIA')).toBeVisible();
        await expect(page.getByText('RETIRO PARA APERTURA CERTIFICADO FINANCIEROS PAGADERAS')).toBeVisible();
        await expect(page.getByText('RETIRO PARA APERTURA CERTIFICADO APORTACIONES PREFERENTES')).toBeVisible();
        await expect(page.getByText('GENERADO AUTOMATICAMENTE PARA APLICAR DESEMBOLSO PRESTAMO').first()).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES', {exact: true})).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES PREFERENTES (FINANZAS)')).toBeVisible();
        await expect(page.getByText('PAGO A PRESTAMO')).toBeVisible();
        await expect(page.getByText('CANCELACION DOCUMENTO POR PAGAR').last()).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 11,722.22' })).toBeVisible();

        // Click al boton de pignoraciones
        const botonPignoraciones = page.getByRole('button', {name: 'Ir a pignoración'});
        await expect(botonPignoraciones).toBeVisible();
        await botonPignoraciones.click();

        // Se debe mostrar un modal de las pignoraciones de la cuenta
        await expect(page.locator('h1').filter({hasText: 'HISTORIAL DE PIGNORACIONES'})).toBeVisible();

        // Cerrar el modal
        await page.locator('[aria-label="close"]').click();

        // Se debe cerrar el modal por lo que el titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();
    });

    test('Cuenta de Ahorros por Nomina del Socio', async () => {

    });

    test('Cuenta de Ahorros - Orden de Pago del Socio', async () => {

    });

    test('Cuenta de Certificados - Financieros Pagaderas del Socio', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // Buscar una cuenta del mismo socio
        await buscador.fill(`${nombre} ${apellido}`);
        // Elegir la Cuenta de Certificado - Financieros Pagaderos
        await page.getByText('| FINANCIEROS PAGADERAS |').click();

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
        await expect(page.getByText('CANCELACION DOCUMENTO POR PAGAR')).toBeVisible();

        // El balance final debe ser 0, ya que la cuenta esta cancelada
        await expect(page.getByRole('row', { name: 'Balance Final : 0.00' })).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});