import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con la Carta de Saldo', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false 
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona alamacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Carta de Saldo', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Carta de Saldo
        await page.getByRole('menuitem', {name: 'Carta de Saldo'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/carta_saldo/01-3-2-5?step=1`);
    });

    test('Buscar prestamo de un socio', async () => {
        // Titull principal
        await expect(page.locator('h1').filter({hasText: 'CARTA DE SALDO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill('LISA ANGELA BUENO DIAZ');
        
        // Financiamiento
        await expect(page.getByRole('cell', {name: 'CRÉDITO HIPOTECARIO'})).toBeVisible();

        // Cliente
        await expect(page.getByRole('cell', {name: 'LISA ANGELA BUENO DIAZ'})).toBeVisible();

        // Monto
        await expect(page.getByRole('cell', {name: 'RD$ 50,000.00'})).toBeVisible();

        // Plazo 
        await expect(page.getByRole('cell', {name: '48'})).toBeVisible();

        // Cuota
        await expect(page.getByRole('cell', {name: 'RD$ 416.67'})).toBeVisible();
    });

    test('Imprimir la Carta de Saldo', async () => {
        // Boton de generar carta
        const generarCarta = page.locator('[data-icon="file-text"]');
        // Esperar que se abra otra ventana con la carta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de generar carta
            await expect(generarCarta).toBeVisible(),
            await generarCarta.click()
        ]);

        // Cerrar la pagina con la carta
        await newPage.close();
    });

    test('Ver los datos del prestamo', async () => {
        // Titulo de la seccion de solicitud de credito
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD DE CRÉDITO - (UNDEFINED)'})).toBeVisible();

        // Ver el prestamo
        await page.locator('[data-icon="eye"]').click();

        
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
