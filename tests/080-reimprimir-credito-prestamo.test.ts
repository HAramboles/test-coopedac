import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate, primerDiaMes } from './utils/fechas';
import { url_base, selectBuscar, browserConfig } from './utils/dataTests';

// Variables globles
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Reimpresion del Credito a Prestamo', async () => {
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

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Reimprimir Credito a Prestamo', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Credito a Prestamos
        await page.getByRole('menuitem', {name: 'Reimprimir Crédito a Préstamos'}).click();

        // La URL debe cambiar  
        await expect(page).toHaveURL(`${url_base}/reimprimir_credito_prestamos/01-3-5-4/`);
    }); 

    test('Buscar el Credito de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR CRÉDITO A PRÉSTAMOS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio buscado
        await page.getByRole('option', {name: `${nombre} ${apellido}`}).click();

        // Fecha Inicial, debe tener la fecha del principio de mes
        await expect(page.locator('#form_FECHA_INICIAL')).toHaveValue(`${primerDiaMes}`);

        // Fecha Final, debe tener la fecha actual
        await expect(page.locator('#form_FECHA_FINAL')).toHaveValue(`${formatDate(new Date())}`);

        // Click al boton de buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Debe mostrarse el Credito al Prestamo para Imprimir', async () => {
        // Estado
        await expect(page.getByText('A', {exact: true})).toBeVisible();

        // Concepto
        await expect(page.getByText('ABONO A CAPITAL')).toBeVisible();

        // Cliente
        await expect(page.getByRole('cell', { name: `${nombre} ${apellido}`})).toBeVisible();
        
        // Monto
        await expect(page.getByText('25,000.00')).toBeVisible();

        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'printer'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close(); 

        // Debe regresar a la pagina anterior
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR CRÉDITO A PRÉSTAMOS'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
