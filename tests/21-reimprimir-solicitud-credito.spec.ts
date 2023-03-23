import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Prueba con la Reimpresion de la Solicitud de Credito', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: true,
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

    test('Ir a la opcion de Reimpresion de Solicitud de Credito', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Solicitudde Credito
        await page.getByRole('menuitem', {name: 'Reimprimir Solicitud de Crédito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/reimprimir_solicitud_credito/01-3-5-2/`);
    });

    test('Buscar un socio', async () => {
        // Nombre y apellidos de la persona almacenada en el state
        const nombre = page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Ingresar un socio
        const buscador = page.locator('#select-search');
        await buscador.fill(`${nombre} ${apellido}`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
