import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Nombre y apellido de la persona
let nombre: string|null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con la Reimpresion de la Solicitud de Reprogramacion', () => {
    test.beforeAll(async () => { // Despues de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear al page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
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
        await expect(page).toHaveURL(`${url_base}/reimp_solicitud_reprogramacion/01-3-5-5/`);
    });

    test('Buscar un Socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REPROGRAMACIÓN SOLICITUD REPROGRAMACION'})).toBeVisible();

        // El estado de las solicitudes debe estar en Pendiente
        const estadoSolicitud = page.getByText('PENDIENTES', {exact: true});
        await expect(estadoSolicitud).toBeVisible();

        // No debe cambiar o no se deben mostrar mas opciones aunque se le haga click
        await estadoSolicitud.click();

        // Buscar un socio
        await page.locator('#form_search').fill('MIA INES GARCIA LUPERON');
    });

    test('Reimprimir la Solicitud del Socio', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('row', {name: 'MIA INES GARCIA LUPERON	CRÉDITO HIPOTECARIO'}).getByRole('button', {name: 'Printer'});
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close(); 
    });

    test.afterAll(async () => { // Antes de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    })
})