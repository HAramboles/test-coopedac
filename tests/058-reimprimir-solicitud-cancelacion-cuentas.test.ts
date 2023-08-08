import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Reimpresion Solicitud Cancelacion', () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
            args: ['--window-position=-1300,100'],
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
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
        await page.locator(`${formBuscar}`).fill(`${cedula}`);
        
        // El estado solicitud debe estar en pendiente
        await expect(page.locator('text=PENDIENTE')).toBeVisible();

        // Se debe mostrar el tipo de cuenta
        await expect(page.getByRole('cell', {name: 'ORDEN DE PAGO', exact: true})).toBeVisible();

        // Se debe mostrar las observaciones colocadas en el inventario
        await expect(page.getByText('TIENE MUCHAS CUENTAS, CERRAR LA DE ORDEN DE PAGO')).toBeVisible();
    });

    test('Imprimir la Solicitud de Cancelacion', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'Printer'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();
    });

    test.afterAll(async () => { // Antes de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
