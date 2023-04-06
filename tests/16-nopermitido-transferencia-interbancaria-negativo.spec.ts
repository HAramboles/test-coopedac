import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('No permitir una Transferencia Interbancaria si la cuenta de Ahorros no tiene un monto', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        browser = await chromium.launch({
          headless: false,
        });
    
        // Crear el context
        context = await browser.newContext({
          storageState: 'state.json'
        });
    
        // Crear una nueva page
        page = await context.newPage();
    
        // Ingresar a la url de la pagina
        await page.goto(`${url_base}`);
    
    });

    // Cedula de la persona almacenada en el state
    const cedula = page.evaluate(() => window.localStorage.getItem('cedula'));
    
    test('Ir a la opcion de Solicitud Transferencia Interbancaria', async () => {
        // Captaciones
        await page.locator("text=CAPTACIONES").click();
    
        // Operaciones
        await page.locator('text=OPERACIONES').click();
    
        // Solicitud Transferencia Interbancaria
        await page.locator('text=Solicitud Transferencia Interbancaria').click();
    
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_transferencia/01-2-2-110/`);
    
        // El titulo de Solicitud Transferencia Interbancaria
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD TRANSFERENCIA INTERBANCARIA'})).toBeVisible();
    });
    
    test('El saldo disponible es negativo, por lo que no es posible hacer la transferencia', async () => {
        // Titulo datos del solicitante debe estar visible
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOLICITANTE'})).toBeVisible();
    
        // Ingresar un socio
        const campoSocio = page.locator('#select-search');
        await expect(campoSocio).toBeVisible();
    
        await campoSocio?.fill(`${cedula}`);
        // Elegir la opcion con el socio buscado
        await page.locator(`text=${cedula}`).click();
    
        // Ingresar la cuenta de origen
    
        // Titulo datos transferencia
        await expect(page.locator('h1').filter({hasText: 'DATOS TRANSFERENCIA'})).toBeVisible();
    
        // Cuenta de origen
        const campoCuentaOrigen = page.locator('#form_ID_CUENTA_DEBITAR');
        await campoCuentaOrigen.click();
        // Seleccionar ahorros normales
        await page.locator('text=AHORROS NORMALES').click();
    
        // Debe salir un modal
        await expect(page.locator('text=La cuenta seleccionada no tiene saldo disponible.')).toBeVisible();
        // Click en Aceptar
        const botonAceptar = page.getByRole('dialog').getByRole('button', { name: 'check Aceptar' });
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();
    });
      
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page 
        await page.close();
    
        // Cerrar el context
        await context.close();
    });
});