import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, contextConfig } from './utils/dataTests';
import { url_denominaciones_caja } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con las Denominaciones por Caja', () => {
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

    test('Ir a la opcion de Denominaciones por Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Denominaciones por Caja
        await page.getByRole('menuitem', {name: 'Denominaciones por caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_denominaciones_caja}`);
    });

    test('Cambiar los Sucursales de las Cajas', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'DENOMINACIONES POR CAJA'})).toBeVisible();

        // Debe mostrare otro titulo de denominaciones
        // Como no hay una caja seleccionada solo debe mostrarse la palabra denominaciones
        await expect(page.getByRole('heading', { name: 'Denominaciones', exact: true })).toBeVisible();

        // La sucursal por defecto debe ser todas las sucursales
        const todasSucursales = page.getByText('TODAS LAS SUCURSALES');
        await expect(todasSucursales).toBeVisible();

        // Cambiar de sucursal
        await todasSucursales.click();
        // Elegir informes
        await page.getByText('INFORMES').click();

        // Solo debe mostrarse la caja de Testing
        const cajaTesting = page.getByText('CAJA DE TESTING');
        await expect(cajaTesting).toBeVisible(); 
        
        // Seleccionar la caja de testing
        await cajaTesting.click();

        // En el titulo de denominaciones debe aparecer el nombre de la caja seleccionada
        await expect(page.locator('h1').filter({hasText: 'DENOMINACIONES CAJA DE TESTING'})).toBeVisible();

        // Cambiar de sucursal
        await page.locator('#root').getByText('INFORMES').click();
        // Elegir oficina empo
        await page.getByText('OFICINA EMPO').click();

        // Debe mostrarse  aperdomo
        const cajaAperdomo = page.getByText('APERDOMO', {exact: true});
        await expect(cajaAperdomo).toBeVisible();

        // Seleccionar aperdomo, y el titulo debe cambiar
        await cajaAperdomo.click();
        await expect(page.locator('h1').filter({hasText: 'DENOMINACIONES APERDOMO'})).toBeVisible();

        // Cambiar de sucursal
        await page.locator('#root').getByText('OFICINA EMPO').click();
        // Elegir oficina principal
        await page.getByText('OFICINA PRINCIPAL', {exact: true}).click();

        // Debe mostrarse la caja bpsharamboles
        const cajaBPSH = page.getByText('CAJA BPSHARAMBOLES');
        await expect(cajaBPSH).toBeVisible();

        // Seleccionar la caja de bpsharamboles, y el titulo debe cambiar
        await cajaBPSH.click();
        await expect(page.locator('h1').filter({hasText: 'DENOMINACIONES CAJA BPSHARAMBOLES'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
