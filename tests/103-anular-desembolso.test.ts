import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, formBuscar, ariaCancelar } from './utils/dataTests';
import { url_anular_desembolso } from './utils/urls';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la empresa
let nombreEmpresa: string | null;

// Pruebas
test.describe.serial('Pruebas con la Anulacion de Desembolso', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ir a la pagina principal
        await page.goto(`${url_base}`);

        // Nombre de la empresa almacenada en el state
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
    });

    test('Ir a la opcion de Anular Desembolso', async () => {
        // Negocios
        await page.getByRole('button', { name: 'NEGOCIOS'}).click();

        // Anulaciones
        await page.getByRole('button', { name: 'ANULACIONES'}).click();

        // Anular Desembolso
        await page.getByRole('button', { name: 'Anular Desembolso'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_desembolso}`);
    });

    test('Anular el Desembolso de la Solicitud de Credito Agricola de la Persona Juridica', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULACIÓN DE DESEMBOLSO'})).toBeVisible();

        // Digitar el nombre de la empresa
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Debe mostrarse la solicitud desembolsada de la empresa
        const solicitudDesembolsadaEmpresa = page.getByRole('cell', {name: `${nombreEmpresa}`});
        await expect(solicitudDesembolsadaEmpresa).toBeVisible();

        // Click al boton de Anular Desembolso
        await solicitudDesembolsadaEmpresa.locator(`${ariaCancelar}`).click();

        //
    });
    
    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
