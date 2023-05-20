import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la empresa
let nombreEmpresa: string | null;

// Pruebas

test.describe('Pruebas con el Historial de las Categorias de un Socio', () => {
    test.beforeAll(async () => {
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

        // Nombre de la persona juridica almacenada en el state
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombreJuridica'));
    });

    test('Ir a la opcion de Historial Categorias Socio', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Historial Cateorias Socio
        await page.getByRole('menuitem', {name: 'Historial Categorías Socio'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/historial_categoria_socio/01-2-4-11/`);
    });

    test('Categorias de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'HISTORIAL DE CAMBIO DE CATEGORÍA'})).toBeVisible();

        // Buscar un socio
        await page.locator('#form_search').fill(`${nombreEmpresa}`);

        // 
    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
