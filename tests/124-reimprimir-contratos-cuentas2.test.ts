import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataFile, ariaCerrar, formBuscar } from './utils/data/inputsButtons';
import { url_base, url_reimprimir_contratos_cuentas } from './utils/dataPages/urls';
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
test.describe.serial('Prueba con la Reimpresion de los Contratos de las Cuentas', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
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
        await expect(page).toHaveURL(`${url_reimprimir_contratos_cuentas}`);
    });

    test('Buscar un socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRESIÓN CONTRATOS'})).toBeVisible();

        // Ingresar la cedula del socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // Esperar que los datos carguen
        await page.waitForTimeout(2000);
    });

    test('Los prestamos no debes mostrarse', async () => {
        // Prestamos
        const cuentaPrestamos = page.getByRole('row', {name: 'PRESTAMOS'}).first();
        await expect(cuentaPrestamos).not.toBeVisible();
    });

    test('Reimprimir Contrato - Cuenta de Aportaciones', async () => {
        // Cuenta de Aportaciones
        const cuentaAportaciones = page.getByRole('row', {name: 'APORTACIONES Activo file-text'});
        await expect(cuentaAportaciones).toBeVisible();

        // Generar contrato
        const contratoAportaciones = cuentaAportaciones.getByRole('button', {name: 'file-text'});
        expect(contratoAportaciones).toBeVisible();
        contratoAportaciones.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const pageAportaciones = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await pageAportaciones.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Aportaciones Referentes', async () => {
        // Cuenta de Aportaciones Preferentes
        const cuentaAportacionesReferentes = page.getByRole('row', {name: 'APORTACIONES REFERENTES'});
        await expect(cuentaAportacionesReferentes).toBeVisible();

        // Generar contrato
        const contratoAportacionesPreferentes = cuentaAportacionesReferentes.locator(`${dataFile}`);

        // Click al boton de Aceptar
        expect(contratoAportacionesPreferentes).toBeVisible();
        contratoAportacionesPreferentes.click();

        // Esperar que se abran dos nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');

        // Cerrar las dos paginas
        await page2.close();
        await page1.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Ahorros Normales', async () => {
        // Cuenta de Ahorros
        const cuentaAhorrosNormales = page.getByRole('row', {name: 'AHORROS NORMALES'});
        await expect(cuentaAhorrosNormales).toBeVisible();

        // Generar contrato
        const contratoAhorrosNormales = cuentaAhorrosNormales.locator(`${dataFile}`);
        expect(contratoAhorrosNormales).toBeVisible();
        contratoAhorrosNormales.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const pageAhorros = await context.waitForEvent('page');

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
        expect(contratoAhorrosNomina).toBeVisible();
        contratoAhorrosNomina.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const pageAhorrosNomina = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await pageAhorrosNomina.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('La cuenta de Orden de Pago no debe mostrarse', async () => {
        // Cuenta de Oden de Pago
        const cuentaAhorrosOrdenPago = page.getByRole('row', {name: 'ORDEN DE PAGO'});
        await expect(cuentaAhorrosOrdenPago).not.toBeVisible();
    });

    test('Reimprimir Contrato - Cuenta de Certificados - Financieros Pagaderas', async () => {
        // Cuenta de Certificados - Financieros Pagaderas
        const cuentaFinancierosPagaderas = page.getByRole('row', {name: 'FINANCIEROS PAGADERAS'});
        await expect(cuentaFinancierosPagaderas).toBeVisible();

        // Generar contrato
        const contratoFinancierosPagaderas = cuentaFinancierosPagaderas.locator(`${dataFile}`);

        expect(contratoFinancierosPagaderas).toBeVisible();
        contratoFinancierosPagaderas.click();

        // Esperar que se abran dos nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');

        // Cerrar las dos paginas
        await page2.close();
        await page1.close();

        // Cerrar el mensaje que se muestra
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Reimprimir Contrato - Cuenta de Certificados - Financieros Reinvertidas', async () => {
        // Cuenta de Certificados - Financieros Pagaderas
        const cuentaFinancierosReinvertidas = page.getByRole('row', {name: 'FINANCIEROS REINVERTIDAS'});
        await expect(cuentaFinancierosReinvertidas).toBeVisible();

        // Generar contrato
        const contratoFinancierosReinvertidas = cuentaFinancierosReinvertidas.locator(`${dataFile}`);
        expect(contratoFinancierosReinvertidas).toBeVisible();
        contratoFinancierosReinvertidas.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const pageFinancierosReinvertidas = await context.waitForEvent('page');

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
        expect(contratoInversionPagaderas).toBeVisible();
        contratoInversionPagaderas.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const pageInversionPagaderas = await context.waitForEvent('page');

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
