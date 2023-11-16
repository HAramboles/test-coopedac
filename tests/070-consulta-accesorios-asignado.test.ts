import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { selectBuscar } from './utils/data/inputsButtons';
import { url_base, url_consulta_accesorios } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig'

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Consulta de los Accesorios Asignados', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Consultar Accesorios', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consultar Accesorios
        await page.getByRole('menuitem', {name: 'Consultar Accesorios'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_consulta_accesorios}`);
    });

    test('Buscar el Accesorio Asignado a la persona', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA DE ACCESORIOS ASIGNADOS'})).toBeVisible();

        // La tabla de los accesorios debe estar visible
        await expect(page.getByRole('columnheader', {name: 'No. Cuenta'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Socio'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Accesorio', exact: true})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Número de Accesorio'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Secuencia Inicial'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Secuencia Final'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Estado'})).toBeVisible();

        // Buscar a la persona
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Click a la opcion con la persona buscada
        await page.getByRole('option', {name: `${nombre} ${apellido}`}).click();

        // Esperar a que carguen los datos
        await page.waitForTimeout(2000);

        // Deben mostrarse los datos del accesorio asigando a la persona
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'TALONARIOS ORDEN DE PAGO'})).toBeVisible();
        await expect(page.getByRole('cell', {name: '21', exact: true})).toBeVisible();
        await expect(page.getByRole('cell', {name: '1', exact: true})).toBeVisible();
        await expect(page.getByRole('cell', {name: '100'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'ACTIVO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
