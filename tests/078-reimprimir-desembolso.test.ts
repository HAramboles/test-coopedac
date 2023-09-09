import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataPrinter, formBuscar, browserConfig } from './utils/dataTests';
import { url_reimprimir_desembolso } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Reimpresion de Desembolso', () => {
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

    test('Ir a la opcion de Reimprimir Desembolso', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Desembolso
        await page.getByRole('menuitem', {name: 'Reimprimir Desembolso'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_desembolso}`);
    });

    test('Datos del Credito del Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR DESEMBOLSO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);
        
        // Socio
        const socio = page.getByRole('row', {name: `${nombre} ${apellido}`});
        await expect(socio).toBeVisible();
        
        // Estado
        await expect(socio.getByRole('cell', {name: 'DESEMBOLSADO'})).toBeVisible();

        // Financiamiento
        await expect(page.getByText('CRÉDITO HIPOTECARIO')).toBeVisible();

        // Monto
        await expect(page.getByText('50,000.00')).toBeVisible();

        // Plazo
        await expect(page.getByText('48')).toBeVisible();

        // Cuota
        await expect(page.getByText('416.67')).toBeVisible();
    });

    test('Reimprimir el Desembolso de una Solicitud de un Socio', async () => {
        // Boton Imprimir de la pagina
        const botonImprimir = page.locator(`${dataPrinter}`);
        await botonImprimir.click();

        // Debe abrirse un modal
        await expect(page.getByRole('dialog').locator('h1').filter({hasText: 'REIMPRIMIR DESEMBOLSO'})).toBeVisible();

        // Boton de Imprimir del modal
        const botonImprimir2 = page.getByRole('dialog', {name: 'Reimprimir Desembolso'}).getByRole('button', {name: 'printer'});
        await expect(botonImprimir2).toBeVisible(),
        await botonImprimir2.click()

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();

        // Debe regresar a la pagina
        await expect(page.getByRole('dialog').locator('h1').filter({hasText: 'REIMPRIMIR DESEMBOLSO'})).toBeVisible();

        // Cerrar el modal
        await page.getByRole('button', {name: 'Salir'}).click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
