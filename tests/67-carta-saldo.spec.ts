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
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
        
        // Financiamiento
        await expect(page.getByRole('cell', {name: 'CRÉDITO HIPOTECARIO'})).toBeVisible();

        // Cliente
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Monto
        await expect(page.getByRole('cell', {name: 'RD$ 50,000.00'})).toBeVisible();

        // Plazo 
        await expect(page.getByRole('cell', {name: '48'})).toBeVisible();

        // Cuota
        await expect(page.getByRole('cell', {name: 'RD$ 416.67'})).toBeVisible();
    });

    test('No debe mostrarse las solicitudes de credito', async () => {
        // La solicitud de credito solo debe mostrarse cuando se le de click a ver solicitud
        await expect(page.getByText('SOLICITUD DE CRÉDITO - (UNDEFINED)')).not.toBeVisible();
    });

    test('Ver los datos del prestamo', async () => {
        // Ver el prestamo
        await page.locator('[data-icon="eye"]').click();

        // Debe salir un modal con la solicitud
        const modal = page.locator('h1').filter({hasText: 'SOLICITUD DE CREDITO'}).first();
        await expect(modal).toBeVisible();

        // Debe mostrarse el nombre del socio como un titulo
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // El boton de salir no debe estar visible
        await expect(page.getByRole('button', {name: 'Salir'})).not.toBeVisible();

        // El boton de finalizar no debe estar visible
        await expect(page.getByRole('button', {name: 'Finalizar'})).not.toBeVisible();

        // Ir a la seccion de los cargos
        await page.getByText('3 Cargos del Préstamo').click();

        // Los cargos deben mostrarse

        // Ir a la seccion de los documentos
        await page.getByText('9 Documentos').click();

        // Los documentos deben mostrase

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El modal debe desaparecer
        await expect(modal).not.toBeVisible();
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

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});