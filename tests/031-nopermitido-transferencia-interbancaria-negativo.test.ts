import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar, browserConfig, contextConfig } from './utils/dataTests';
import { url_solicitud_transferencia_interbancaria } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('No permitir una Transferencia Interbancaria si la cuenta de Ahorros no tiene un monto', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        browser = await chromium.launch(browserConfig);
    
        // Crear el context
        context = await browser.newContext(contextConfig);
    
        // Crear una nueva page
        page = await context.newPage();
    
        // Ingresar a la url de la pagina
        await page.goto(`${url_base}`);
        
        // Cedula de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
    });
    
    test('Ir a la opcion de Solicitud Transferencia Interbancaria', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
    
        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
    
        // Solicitud Transferencia Interbancaria
        await page.getByRole('menuitem', {name: 'Solicitud Transferencia Interbancaria'}).click();
    
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_transferencia_interbancaria}`);
    
        // El titulo de Solicitud Transferencia Interbancaria estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD TRANSFERENCIA INTERBANCARIA'})).toBeVisible();
    });
    
    test('El saldo disponible es negativo, por lo que no es posible hacer la transferencia', async () => {
        // Titulo datos del solicitante debe estar visible
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOLICITANTE'})).toBeVisible();
    
        // Ingresar un socio
        const campoSocio = page.locator(`${selectBuscar}`).first();
        await expect(campoSocio).toBeVisible();
    
        await campoSocio?.fill(`${cedula}`);
        // Elegir la opcion con el socio buscado
        await page.locator(`text=${cedula}`).click();
    
        // Ingresar la cuenta de origen
    
        // Titulo datos transferencia
        await expect(page.locator('h1').filter({hasText: 'DATOS TRANSFERENCIA'})).toBeVisible();
    
        // Cuenta de origen
        const campoCuentaOrigen = page.locator(`${selectBuscar}`).last();
        await campoCuentaOrigen.click();
        // Seleccionar ahorros normales
        await page.locator('text=AHORROS NORMALES').click();
    
        // Debe salir un modal
        await expect(page.locator('text=La cuenta seleccionada no tiene saldo disponible.')).toBeVisible();

        // Click en Aceptar
        const botonAceptar = page.getByRole('dialog').getByRole('button', {name: 'check Aceptar'});
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