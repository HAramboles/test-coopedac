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
test.describe('Pruebas con el Desembolso de Lineas de Credito', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
            args: ['--window-position=-1300,100'],
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, ombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Desembolso Lineas Credito', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Desembolso lineas credito
        await page.getByRole('menuitem', {name: 'Desembolso Líneas Crédito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/desembolso_linea_credito/01-3-3-3/`);
    });

    test('Linea de Credito de un Socio', async () => {
        test.slow();

        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'DESEMBOLSO LÍNEAS CRÉDITO'})).toBeVisible();

        // Las solicitudes deben estar en desembolsado
        await expect(page.getByText('DESEMBOLSADO')).toBeVisible();

        // Buscar a un socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // Click al boton de buscar
        await page.locator('[data-icon="search"]').click();

        // Cliente
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Financiamiento
        await expect(page.getByRole('row', {name: `${nombre} ${apellido}`}).getByText('LÍNEA DE CRÉDITO')).toBeVisible();

        // Monto
        await expect(page.getByRole('cell', {name: 'RD$ 20,000.00'})).toBeVisible();

        // Plazo 
        await expect(page.getByRole('cell', {name: '12'})).toBeVisible();

        // Cuota
        await expect(page.getByRole('cell', {name: 'RD$ 16.67'})).toBeVisible();

        // Click al boton de desembolsar
        await page.locator('[aria-label="dollar-circle"]').click();

        // Se debe abrir un modal para desembolsar la solicitud
        // Como la solicitud fue desembolsada no tiene un monto disponible
        // Por lo que debe mostrarse un mensaje que muestre que no tiene monto disponible
        await expect(page.getByText('Sin monto disponible')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
