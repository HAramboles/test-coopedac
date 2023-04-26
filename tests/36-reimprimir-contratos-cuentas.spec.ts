import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API

// Pruebas

test.describe('Prueba con la Reimpresion delos Contratos de las Cuentas', () => {
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
        // Nombre y apellido de la persona
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRESIÓN CONTRATOS'})).toBeVisible();

        // Ingresar la cedula del socio
        await page.locator('#form_search').fill(`${nombre} ${apellido}`);
    });

    test('Todas las cuentas creadas anteriormente deben estar visibles', async () => {
        // Cuenta de Aportaciones
        const cuentaAportaciones = page.getByRole('row', {name: 'APORTACIONES'}).first();
        await expect(cuentaAportaciones).toBeVisible();

        // Generar contrato
        const contratoAportaciones = cuentaAportaciones.getByRole('button', {name: 'file-text'});
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageAportaciones] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(contratoAportaciones).toBeVisible(),
            await contratoAportaciones.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageAportaciones.close();

        // Cuenta de Ahorros
        const cuentaAhorros = page.getByRole('row', {name: 'AHORROS NORMALES'});
        await expect(cuentaAhorros).toBeVisible();

        // Generar contrato
        const contratoAhorros = cuentaAhorros.locator('[data-icon="file-text"]');
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageAhorros] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(contratoAhorros).toBeVisible(),
            await contratoAhorros.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageAhorros.close();

        // Cuenta de Aportaciones Preferentes
        const cuentaAportacionesPreferentes = page.getByRole('row', {name: 'APORTACIONES PREFERENTES'});
        await expect(cuentaAportacionesPreferentes).toBeVisible();

        // Generar contrato
        const contratoAportacionesPreferentes = cuentaAportacionesPreferentes.locator('[data-icon="file-text"]');
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageAportacionesPreferentes, pageAportacionesPreferentes2] = await Promise.all([
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(contratoAportacionesPreferentes).toBeVisible(),
            await contratoAportacionesPreferentes.click()
        ]);

        // Cerrar las dos paginas con los reportes
        await pageAportacionesPreferentes.close();
        await pageAportacionesPreferentes2.close();

        // Cuenta de Certificados - Financieros Pagaderas
        const cuentaFinancierosPagaderas = page.getByRole('row', {name: 'APORTACIONES PREFERENTES'});
        await expect(cuentaFinancierosPagaderas).toBeVisible();

        // Generar contrato
        const contratoFinancierosPagaderas = cuentaFinancierosPagaderas.locator('[data-icon="file-text"]');
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [pageFinancierosPagaderas] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(contratoFinancierosPagaderas).toBeVisible(),
            await contratoFinancierosPagaderas.click()
        ]);

        // Cerrar la pagina con el reporte
        await pageFinancierosPagaderas.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
