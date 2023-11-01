import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar, browserConfig, contextConfig } from './utils/dataTests';
import { url_desembolso_lineas_credito } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Desembolso de Lineas de Credito', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Desembolso Lineas Credito', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Desembolso lineas credito
        await page.getByRole('menuitem', {name: 'Desembolso Líneas Crédito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_desembolso_lineas_credito}`);
    });

    test('Buscar la Linea de Credito de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'DESEMBOLSO LÍNEAS CRÉDITO'})).toBeVisible();

        // Las solicitudes deben estar en desembolsado
        await expect(page.getByText('DESEMBOLSADO')).toBeVisible();

        // Buscar a un socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Click al boton de buscar
        await page.locator('[data-icon="search"]').click();

        // Cliente
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Financiamiento
        await expect(page.getByRole('row', {name: `${nombre} ${apellido}`}).getByText('LÍNEA DE CRÉDITO')).toBeVisible();

        // Monto
        await expect(page.getByRole('row', {name: `${nombre} ${apellido}`}).getByText('RD$ 200,000.00')).toBeVisible();

        // Plazo 
        await expect(page.getByRole('row', {name: `${nombre} ${apellido}`}).getByText('12')).toBeVisible();

        // Cuota
        await expect(page.getByRole('row', {name: `${nombre} ${apellido}`}).getByText('RD$ 1,162.50')).toBeVisible();
    });

    test('Desembolsar la otra mitad de la Linea de Credito', async () => {
        // Click al boton de desembolsar
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).locator('[aria-label="dollar-circle"]').click();

        // Se debe abrir un modal para desembolsar la solicitud
        await expect(page.getByText('DESEMBOLSO DE PRÉSTAMO')).toBeVisible();

        // Debe mostrarse el monto disponible luego de desembolsar la mitad de la linea
        await expect(page.locator('text=RD$ 100,000.00')).toBeVisible();

        // Click al boton de Desembolsar Todo
        const botonDesembolsarTodo = page.locator('(//INPUT[@type="checkbox"])[2]');
        await expect(botonDesembolsarTodo).toBeVisible();
        await botonDesembolsarTodo.click();

        // Click fuera del boton
        await page.getByRole('cell', {name: 'Monto a Desembolsar :'}).click();

        // Neto a Entegar
        await expect(page.getByRole('row', {name: 'Neto a Entregar : RD$ 100,000.00'})).toBeVisible();

        // Click al boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
