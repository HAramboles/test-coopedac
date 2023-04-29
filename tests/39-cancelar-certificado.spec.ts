import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con la Cancelacion de Certificados', () => {
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
    });

    test('Ir a la opcion de Cancelar Certificados', async () => {
        // CAPTACIONES
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // PROCESOS
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Cancelar Certificado
        await page.getByRole('menuitem', {name: 'Cancelar certificado'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cancelar_certificado/01-2-3-5/`);
    });

    test('Cancelar el Certificado de un Socio', async () => {
        // Cedula, nombre y apellido de la persona
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CANCELACIÓN DE CERTIFICADO FINANCIERO'})).toBeVisible();

        // Buscar un socio
        await page.locator('#select-search').first().fill(`${cedula}`);
        // Elegir al socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Se debe mostrar la categoria del socio
        await expect(page.getByText('SOCIO AHORRANTE')).toBeVisible();

        // Datos del Certificado

        // Tipo de Captacion
        //await expect(page.locator('#form_DESCTIPOCAPTACION')).toHaveValue('FINANCIEROS PAGADERAS');

        // Plazo
        await expect(page.locator('#form_PLAZO')).toHaveValue('24');

        // Monto Apertura
        await expect(page.locator('#form_MONTO_APERTURA').first()).toHaveValue('RD$ 50');

        // Cuenta Deposito
        await page.locator('#select-search').last().click();
        // Elegir la cuenta de Ahorros
        await page.getByText('AHORROS NORMALES').click();

        // Cancelar el certificado
        const botonCancelar = page.getByRole('button', {name: 'Cancelar'});
        await expect(botonCancelar).toBeVisible();
        await botonCancelar.click();

        // Debe salir un modal para confirmar la cancelacion
        await expect(page.locator('text=Confirmación')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se debe mostrar un mensaje de que se cancelo correctamente el certificado
        await expect(page.locator('text=Operación exitosa')).toBeVisible();

        // Click en Aceptar para cerrar el mensaje de confirmacion
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test('Confirmar que la Cuenta de Certificado del Socio se cancelo correctamente - Ir a la opcion de Certificados', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
        // Apertura de cuentas
        await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();

        // Certificados
        await page.getByRole('menuitem', {name: 'Certificados'}).first().click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados`);
    });

    test('Elegir un tipo de captacion', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();

        // Boton de seleccionar captaciones
        const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
        await expect(botonCaptaciones).toBeVisible();
        // Click al boton
        await botonCaptaciones.click();

        // Constante con la opcion de financieros pagaderas
        const tipoCertificado = page.locator('text=FINANCIEROS PAGADERAS');

        if (await tipoCertificado.isHidden()) {
            // Recargar la pagina
            await page.reload();
            // Seleccionar el tipo de captacion financieros pagaderas
            await botonCaptaciones.click();
            await page.locator('text=FINANCIEROS PAGADERAS').click();
        } else if (await tipoCertificado.isVisible()) {
            // Seleccionar el tipo de captacion financieros pagaderas
            await page.locator('text=FINANCIEROS PAGADERAS').click();
        }

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8`);
    });

    test('Buscar al Socio al cual se elimino el Certificado', async () => {
        // Cedula de la persona
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        // Buscar al socio
        await page.locator('#form_search').fill(`${cedula}`);

        // No debe mostrar resultados
        await expect(page.getByText('No hay datos')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})