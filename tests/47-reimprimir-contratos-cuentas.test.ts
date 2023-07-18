import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataFile, ariaCerrar, formBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Prueba con la Reimpresion de los Contratos de las Cuentas', () => {
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

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Reimprimir Contratos de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir contratos cuentas
        await page.getByRole('menuitem', {name: 'Reimprimir contratos cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/reimpresion_contratos/01-2-6-1/`);
    });

    test('Buscar un socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRESIÓN CONTRATOS'})).toBeVisible();

        // Ingresar la cedula del socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
    });

    test('Reimprimir Contrato - Cuenta de Aportaciones', async () => {
        // Cuenta de Aportaciones
        const cuentaAportaciones = page.getByRole('row', {name: 'APORTACIONES Activo file-text'});
        await expect(cuentaAportaciones).toBeVisible();

        // Generar contrato
        const contratoAportaciones = cuentaAportaciones.getByRole('button', {name: 'file-text'});
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageAportaciones] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            expect(contratoAportaciones).toBeVisible(),
            contratoAportaciones.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageAportaciones.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Aportaciones Preferentes', async () => {
        // Cuenta de Aportaciones Preferentes
        const cuentaAportacionesPreferentes = page.getByRole('row', {name: 'APORTACIONES PREFERENTES'});
        await expect(cuentaAportacionesPreferentes).toBeVisible();

        // Generar contrato
        const contratoAportacionesPreferentes = cuentaAportacionesPreferentes.locator(`${dataFile}`);

        // Click al boton de Aceptar
        expect(contratoAportacionesPreferentes).toBeVisible();
        contratoAportacionesPreferentes.click();

        // Esperar que se abra dos nuevas pestañas con los reportes de la cuenta
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');

        await page1.close();
        await page2.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Ahorros Normales', async () => {
        // Cuenta de Ahorros
        const cuentaAhorrosNormales = page.getByRole('row', {name: 'AHORROS NORMALES'});
        await expect(cuentaAhorrosNormales).toBeVisible();

        // Generar contrato
        const contratoAhorrosNormales = cuentaAhorrosNormales.locator(`${dataFile}`);
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageAhorros] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            expect(contratoAhorrosNormales).toBeVisible(),
            contratoAhorrosNormales.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageAhorros.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Ahorros Por Nomina', async () => {
        // Cuenta de Ahorros
        const cuentaAhorrosNomina = page.getByRole('row', {name: 'AHORROS POR NOMINA'});
        await expect(cuentaAhorrosNomina).toBeVisible();

        // Generar contrato
        const contratoAhorrosNomina = cuentaAhorrosNomina.locator(`${dataFile}`);
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageAhorrosNomina] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            expect(contratoAhorrosNomina).toBeVisible(),
            contratoAhorrosNomina.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageAhorrosNomina.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Ahorros - Orden de Pago', async () => {
        // Cuenta de Ahorros
        const cuentaAhorrosOrdenPago = page.getByRole('row', {name: 'ORDEN DE PAGO'});
        await expect(cuentaAhorrosOrdenPago).toBeVisible();

        // Generar contrato
        const contratoAhorrosOdenPago = cuentaAhorrosOrdenPago.locator(`${dataFile}`);
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageAhorrosOrdenPago] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            expect(contratoAhorrosOdenPago).toBeVisible(),
            contratoAhorrosOdenPago.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageAhorrosOrdenPago.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Certificados - Financieros Pagaderas', async () => {
        // Cuenta de Certificados - Financieros Pagaderas
        const cuentaFinancierosPagaderas = page.getByRole('row', {name: 'FINANCIEROS PAGADERAS'});
        await expect(cuentaFinancierosPagaderas).toBeVisible();

        // Generar contrato
        const contratoFinancierosPagaderas = cuentaFinancierosPagaderas.locator(`${dataFile}`);

        expect(contratoFinancierosPagaderas).toBeVisible();
        contratoFinancierosPagaderas.click();

        // Esperar que se abra dos nuevas pestañas con los reportes de la cuenta
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');

        await page1.close();
        await page2.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Certificados - Financieros Reinvertidas', async () => {
        // Cuenta de Certificados - Financieros Pagaderas
        const cuentaFinancierosReinvertidas = page.getByRole('row', {name: 'FINANCIEROS REINVERTIDAS'});
        await expect(cuentaFinancierosReinvertidas).toBeVisible();

        // Generar contrato
        const contratoFinancierosReinvertidas = cuentaFinancierosReinvertidas.locator(`${dataFile}`);
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageFinancierosReinvertidas] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            expect(contratoFinancierosReinvertidas).toBeVisible(),
            contratoFinancierosReinvertidas.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageFinancierosReinvertidas.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Certificados - Inversion Pagaderas', async () => {
        // Cuenta de Certificados - Financieros Pagaderas
        const cuentaInversionPagaderas = page.getByRole('row', {name: 'INVERSION PAGADERAS'});
        await expect(cuentaInversionPagaderas).toBeVisible();

        // Generar contrato
        const contratoInversionPagaderas = cuentaInversionPagaderas.locator(`${dataFile}`);
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageInversionPagaderas] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            expect(contratoInversionPagaderas).toBeVisible(),
            contratoInversionPagaderas.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageInversionPagaderas.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
