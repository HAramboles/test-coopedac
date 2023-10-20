import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, contextConfig } from './utils/dataTests';
import { url_anular_cobro_oficina } from './utils/urls';

// Variables globales 
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona que saldo la linea de credito
let nombreTercero: string | null;
let apellidoTercero: string | null;

// Pruebas
test.describe.serial('Pruebas Anulando Cobro de Oficina', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Dirigirse a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona relacionada almacenada en el state
        nombreTercero = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellidoTercero = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
    });

    test('Ir a la pagina de Anular Cobro Oficina', async () => {

    });
    
    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();
        
        // Cerrar el context
        await context.close();
    });
});
