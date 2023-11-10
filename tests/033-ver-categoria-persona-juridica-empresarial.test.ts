import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formBuscar } from './utils/data/inputsButtons';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedulaEmpresa: string | null;
let nombreEmpresa: string | null;

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

        // Cedula y nombre de la persona juridica alamacenada en el state
        cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
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
        await page.locator(`${formBuscar}`).fill(`${cedulaEmpresa}`);

        // El socio buscado debe estar visible
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();

        // La categoria del socio debe estar visible
        await expect(page.getByRole('cell', {name: 'SOCIO EMPRESARIAL'})).toBeVisible();

        // Esperar que se muestre el resultado
        await page.waitForTimeout(6000);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();
        
        // Cerrar el context
        await context.close();
    });
});
