import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con la Solicitud de Cancelacion de una Cuenta', () =>{
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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Cancelacion de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solicitud Cancelacion
        await page.getByRole('menuitem', {name: 'Solicitud Cancelación'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_cancelacion/01-2-2-105/`);
    });

    test('Cuentas del Socio elegido', async () => {
        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Titulo seleccionar cuentas
        await expect(page.locator('h1').filter({hasText: 'Seleccionar Cuenta(S)'})).toBeVisible();

        // Deben estar las cuentas del socio
        await expect(page.getByText('APORTACIONES')).toBeVisible();
        await expect(page.getByText('AHORROS NORMALES').first()).toBeVisible();
        await expect(page.getByText('AHORROS POR NOMINA')).toBeVisible();
        await expect(page.getByText('ORDEN DE PAGO').first()).toBeVisible();
    });

    test('Las cuentas de Certificados NO deben estar visibles', async () => {
        // Certificado Financieros Pagaderas
        await expect(page.getByText('FINANCIEROS PAGADERAS')).not.toBeVisible();

        // Certificado Financieros Reinvertidas
        await expect(page.getByText('FINANCIEROS REINVERTIDAS')).not.toBeVisible();

        // Certificado Inversion Pagaderas
        await expect(page.getByText('INVERSION PAGADERAS')).not.toBeVisible();
    });

    test('Seleccionar una cuenta para Cancelar', async () => {
        // Elegir la cuenta de Orden de Pago
        await page.getByRole('row', {name: 'ORDEN DE PAGO'}).last().getByLabel('').check();

        // Titulo razon o motivo de cierre
        await expect(page.locator('h1').filter({hasText: 'RAZÓN O MOTIVO DE CIERRE'})).toBeVisible();

        // Razon
        await page.locator('#form_ID_RAZON').fill('Otras');
        // Elegir otras razones
        await page.locator('text=OTRAS RAZONES').click();

        // Comentario
        await page.locator('#form_OBSERVACION').fill('Tiene muchas cuentas, cerrar la de Orden de Pago');

        // Boton Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        // Esperar que se abra una nueva pestaña con el reporte de la cancelacion
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close(); 

        // Debe regresar a la pagina
        await expect(page).toHaveURL(`${url_base}/solicitud_cancelacion/01-2-2-105/`);

        // Mensaje de Operacion Exitosa
        await expect(page.locator('text=Solicitud de cambios productos almacenado exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.getByRole('dialog').getByRole('button', {name: 'check Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
