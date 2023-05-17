import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con la Reimpresion Solicitud Cancelacion', () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenados en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Reimprimir Cancelacion', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Solicitud Cancelacion
        await page.getByRole('menuitem', {name: 'Reimprimir solicitud cancelación'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/reimprimir_solicitud_cancelacion/01-2-6-3/`);
    });

    test('Buscar la Solicitud de un Socio', async () => {
        // Buscar un socio
        await page.locator('#form_search').fill('CAITLYN CASTILLO');
        await page.locator('#form_search').fill(`${nombre} ${apellido}`);
        
        // El estado solicitud debe estar en pendiente
        await expect(page.locator('text=PENDIENTE')).toBeVisible();

        // Se debe mostrar el tipo de cuenta
        //await expect(page.getByText('ORDEN DE PAGO')).toBeVisible();
        await expect(page.getByText('AHORROS POR NOMINA')).toBeVisible();

        // Se debe mostrar las observaciones colocadas en el inventario
        await expect(page.getByText('TIENE MUCHAS CUENTAS, CERRAR LA DE ORDEN DE PAGO')).toBeVisible();
    });

    test('Imprimir la Solicitud de Cancelacion', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('row', {name: 'CAITLYN CASTILLO'}).getByRole('button', {name: 'Printer'});
        // Esperar a que se abra una nueva ventana con la solicitud
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Imprimir
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);

        // Cerrar la pagina con la solicitud
        await newPage.close();
    });

    test.afterAll(async () => { // Antes de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
