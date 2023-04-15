import { Browser, BrowserContext, expect, Page, test, chromium } from '@playwright/test';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pueba con el Historial de los Movimientos de una Cuenta', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
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

    test('Ir a la opcion de Consulta Movimientos Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Movimientos Cuenta
        await page.getByRole('menuitem', {name: 'Consulta Movimientos Cuenta'}).click();
    });

    test('Buscar una cuenta de un socio', async () => {
        // Nombre y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/consulta_captaciones/01-2-4-6/`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Buscar un socio
        const buscador = page.locator('#select-search');
        await buscador.click();
        // Ingresar un socio
        await buscador.fill(`${nombre} ${apellido}`);

        // Elegir la cuenta de financieros pagaderas
        await page.getByText('FINANCIEROS PAGADERAS').click();

        // El estado de la cuenta debe ser activa
        await expect(page.locator('text=ACTIVA')).toBeVisible();

        // El titulo de movimientos de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Balance final de todos los movimientos
        await expect(page.locator('h1').filter({hasText: 'BALANCE FINAL :'})).toBeVisible();
        // La cantidad debe ser la misma ingresada en cuenta de certificados
        await expect(page.locator('h1').filter({hasText: '50.00'})).toBeVisible();

        // Imprimir los movimientos
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);
        
        // Cerrar la pagina con el reporte con los movimientos
        await newPage.close();
    });

    test('Buscar otra cuenta del mismo usuario', async () => {
        // Nombre y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Buscar un socio
        const buscador = page.locator('#select-search');
        // await buscador.click();
        await page.locator('.ant-select-clear > .anticon > svg').first().click();

        // Ingresar un socio
        await buscador.fill(`${nombre} ${apellido}`);

        // Elegir la cuenta de ahorros
        await page.getByText('AHORROS NORMALES').click();

        // El estado de la cuenta debe ser activa
        await expect(page.locator('text=ACTIVA')).toBeVisible();

        // El titulo de movimientos de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();
        
        // El deposito realizado anteriormente debe mostrarse   
        await expect(page.getByText('Deposito de 2000 pesos a la cuenta de Ahorros')).toBeVisible();

        // El retiro realizado anteriormnete debe mostrarse
        await expect(page.getByText('Retiro de 100 pesos a la cuenta de Ahorros')).toBeVisible();

        // Imprimir los movimientos
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);
        
        // Cerrar la pagina con el reporte con los movimientos
        await newPage.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});