import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page

// Nombre y apellido de la persona 
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con la Reimpresion de Solicitud de Transferencia Interbancaria', async () => {
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

    test('Ir a la opcion de la Reimpresion de la Solicitud', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Reimpresiones
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Solicitud Transferencia Interbancaria
        await page.getByRole('menuitem', {name: 'Reimp. Solic. Trans. Interbancaria'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/reimp_solicitud_trans_interbancaria/01-2-6-4/`);
    });

    test('Reimprimir la Solicitud del Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'REIMP. SOLIC. TRANS. INTERBANCARIA'})).toBeVisible();

        // La solicitud creada debe estar visible
        const solicitudCreada = page.getByRole('row', {name: `${nombre} ${apellido}`});
        await expect(solicitudCreada).toBeVisible();

        // Boton de imprimir la solicitud
        const botonImprimir = solicitudCreada.getByRole('button', {name: 'printer'});
        // Esperar que se genere el reporte con la solicitud de transferencia interbancaria
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Imprimir
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
          ]);
      
          // Cerrar la pagina abierta con la solicitud
          await newPage.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});