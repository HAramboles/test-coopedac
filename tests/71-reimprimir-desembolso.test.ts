import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataPrinter, formBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con la Reimpresion de Desembolso', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
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
        await expect(page).toHaveURL(`${url_base}/reimprimir_desembolso/01-3-5-3/`);
    });

    test('Datos del Credito del Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR DESEMBOLSO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
        
        // Estado
        await expect(page.getByText('DESEMBOLSADO')).toBeVisible();

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
        // Boton Seleccionar
        const botonSeleccionar = page.getByText('Seleccionar');
        await botonSeleccionar.click();

        // Debe abrirse un modal
        await expect(page.getByRole('dialog').locator('h1').filter({hasText: 'REIMPRIMIR DESEMBOLSO'})).toBeVisible();

        // Boton de Imprimir
        const botonImprimir = page.locator(`${dataPrinter}`);
        await expect(botonImprimir).toBeVisible(),
        await botonImprimir.click()

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
