import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formBuscar } from './utils/data/inputsButtons';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
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
test.describe.serial('Pruebas con la Categoria del Socio', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context 
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ir a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona alamacenados en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Registro de Persona', async () => {
        // Socios
        await page.getByRole('menuitem', {name: 'SOCIOS'}).click();

        // Operaciones 
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Registrar de Persona
        await page.getByRole('menuitem', {name: 'Registrar persona'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_registro_persona}`);
    });

    test('Ver la Categoria Actual de la Persona', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // El socio buscado debe estar visible
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // La categoria del socio debe estar visible
        await expect(page.getByRole('cell', {name: 'SOCIO AHORRANTE'})).toBeVisible();
        await page.getByRole('cell').nth(4).click({clickCount: 4});

        // Esperar que se muestre el resultado
        await page.waitForTimeout(3000);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();
        
        // Cerrar el context
        await context.close();
    });
});
