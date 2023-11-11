import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formBuscar } from './utils/data/inputsButtons';
import { url_base, url_reimprimir_solicitud_reprogramacion } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Reimpresion de la Solicitud de Reprogramacion', () => {
    test.beforeAll(async () => { // Despues de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear al page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de la Reimpresion de la Solicitud de Reprogramacion', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Solicitud Reprogramacion
        await page.getByRole('menuitem', {name: 'Reimp. Solicitud Reprogramacion'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_solicitud_reprogramacion}`);
    });

    test('Buscar un Socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRIMIR SOLICITUD REPROGRAMACION'})).toBeVisible();

        // El estado de las solicitudes debe estar en Pendiente
        const estadoSolicitud = page.getByText('PENDIENTES', {exact: true});
        await expect(estadoSolicitud).toBeVisible();

        // No debe cambiar o no se deben mostrar mas opciones aunque se le haga click
        await estadoSolicitud.click();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);
    });

    test('Reimprimir la Solicitud del Socio', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('row', {name: `${nombre} ${apellido} CRÉDITO HIPOTECARIO`}).getByRole('button', {name: 'Printer'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close(); 
    });

    test.afterAll(async () => { // Antes de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});