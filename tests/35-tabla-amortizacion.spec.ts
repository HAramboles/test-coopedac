import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
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

    test('Ir a la opcion de la Tabla de Amortizacion', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Tabla de amortizacion
        await page.getByRole('menuitem', {name: 'Tabla de amortización'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/tabla_amortizacion/01-3-4-2/`);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TABLA DE AMORTIZACIÓN...'})).toBeVisible();
    });

    test('Calcular la Tabla de Amortizacion de un Socio', async () => {
        // Cedula de la persona
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Titulo General
        await expect(page.locator('h1').filter({hasText: 'GENERAL'})).toBeVisible();

        // Buscar un socio
        await page.locator('#select-search').fill(`${cedula}`);
        // Elegir el socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Colocar un monto
        await page.locator('#amortization_form_MONTO').fill('25000');

        // Colocar una tasa anual
        await page.locator('#amortization_form_TASA').fill('5');

        // Titulo Frecuencia y plazo de pago
        await expect(page.locator('h1').filter({hasText: 'FRECUENCIA Y PLAZO DE PAGO'})).toBeVisible();

        // La frecuencia por defecto debe ser mensual
        await expect(page.locator('#amortization_form_FRECUENCIA')).toHaveValue('MENSUAL');

        // Colocar un plazo
        await page.locator('#amortization_form_PLAZO').fill('12');

        // Click al boton de calcular
        await page.getByRole('button', {name: 'Calcular'}).click();

        // Titulo de Amortizacion
        await expect(page.locator('h1').filter({hasText: 'AMORTIZACIÓN'})).toBeVisible();

        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // La tabla de amortizacion debe estar visible
        await expect(page.getByText('No. Cuota')).toBeVisible();
        await expect(page.getByText('Fecha')).toBeVisible();
        await expect(page.getByText('Abono Programado')).toBeVisible();
        await expect(page.getByText('Capital')).toBeVisible();
        await expect(page.getByText('Interés')).toBeVisible();
        await expect(page.getByText('Seguro')).toBeVisible();
        await expect(page.getByText('Cargos')).toBeVisible();
        await expect(page.getByText('Total')).toBeVisible();
        await expect(page.getByText('Balance')).toBeVisible();

        //
    });

    test('Agregar un Seguro a la tabla de amortizacion', async () => {
        //

    });

    test('Agregar abonos programados a la tabla de amortizacion', async () => {
        //
        await expect(page.getByText('Pagos Extraordinarios')).toBeVisible();

        // Tipo de abono
        await page.locator('text=Recurrente').click();

        // Frecuencia
        await page.locator('#form_NO_CUOTA').fill('2');

        // Monto de los abonos
        await page.locator('#form_MONTO_ABONOS').fill('200');

        // Agregar los pagos extraordinarios
        await page.getByRole('button', {name: 'Agregar'}).click();

        
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    })
})