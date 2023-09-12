import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig } from './utils/dataTests';
import { url_sesiones_transito } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con el Mensaje de Aviso cuando hat Recepciones Pendientes', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Sesiones en Transito', async () => {
        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // OPERACIONES
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Sesiones en Transito
        await page.getByRole('menuitem', {name: 'Sesiones en Tránsito', exact: true}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_sesiones_transito}`);
    });

    test('Mensaje de Aviso por tener Recepciones Pendientes', async () => {
        // Debe mostrarse un mensaje modal
        const modalAviso = page.locator('text=Atención');
        await expect(modalAviso).toBeVisible();

        // Mensaje del modal
        await expect(page.locator('text=Existen una o más recepciones pendientes de aplicar, si no se aplican o anulan, no se podrá cuadrar la caja al final del día. Para solucionarlo ir a: TESORERIA > CAJAS > PROCESOS > Recepción transferencia caja')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El modal debe desaparecer
        await expect(modalAviso).not.toBeVisible();

        // Y se debe estar en la pagina de Sesiones en transito
        await expect(page.locator('h1').filter({hasText: 'SESIONES EN TRÁNSITO'})).toBeVisible();

        // Ahora aplicar la Recepcion Pendiente
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });  
});
