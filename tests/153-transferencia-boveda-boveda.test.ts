import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { url_transferencia_boveda_boveda } from './utils/dataPages/urls';

/* Variables globales */
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Transferencia Banco', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Boveda
        await page.getByRole('menuitem', {name: 'BOVEDA'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transferencia a Banco
        await page.getByRole('menuitem', {name: 'Transferir a bóvedas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_transferencia_boveda_boveda}`);
    });

    test('Realizar la transferencia a la Boveda del Empo', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'TRANSFERIR A BÓVEDAS'})).toBeVisible();

        // Por defecto debe estar seleccionda la boveda principal
        await expect(page.getByTitle('BOVEDA PRINCIPAL')).toBeVisible();

        // La boveda qie rebira el dinero debe ser la del empo
        await expect(page.getByTitle('BOVEDA EMPO')).toBeVisible();

        // Debe estar visible la tabla de las denominaciones de la boveda
        await expect(page.getByRole('heading', {name: 'Denominaciones BOVEDA'})).toBeVisible();
        
        // Debe estar visible la tabla de lo entregado
        await expect(page.getByRole('heading', {name: 'Entregado'})).toBeVisible();

        // Entregar 1 de 1000 pesos

        // Campo de RD 1000
        const cant1000 = page.locator('(//input[@id="CANTIDAD_DIGITADA"])[2]'); 

        // Cantidad = 1
        await cant1000.fill('1');
        
        // Esperar a que se agregue la cantidad digitada
        await page.waitForTimeout(1000);

        // Click al boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Se abre una nueva pagina con el reporte de la transferencia
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina
        await page1.close();

        // Debe regresar a la pagina de Transferencia a Banco
        await expect(page.locator('h1').filter({hasText: 'TRANSFERIR A BÓVEDAS'})).toBeVisible();

        // Aparece una alerta de operacion exitosa
        await expect(page.getByText('Operación exitosa')).toBeVisible();
        await page.waitForTimeout(2000);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});