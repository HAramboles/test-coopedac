import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar, selectBuscar, browserConfig } from './utils/dataTests';
import { url_cancelar_certificado, url_cuentas_certificados, url_cuentas_certificados_financieros_pagaderas } from './utils/urls';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe('Pruebas con la Cancelacion de Certificados', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
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

    test('Ir a la opcion de Cancelar Certificados', async () => {
        // CAPTACIONES
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // PROCESOS
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Cancelar Certificado
        await page.getByRole('menuitem', {name: 'Cancelar certificado'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cancelar_certificado}`);
    });

    test('Cancelar el Certificado de un Socio', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CANCELACIÓN DE CERTIFICADO FINANCIERO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).first().fill(`${cedula}`);
        // Elegir el Certificado Financieros Pagaderas del socio
        await page.locator('text=FINANCIEROS PAGADERAS').click();

        // Se debe mostrar la categoria del socio
        await expect(page.getByText('SOCIO AHORRANTE')).toBeVisible();

        // Datos del Certificado

        // Tipo de Captacion
        await expect(page.locator('(//SPAN[@class="ant-select-selection-item"][text()="FINANCIEROS PAGADERAS"])')).toBeVisible();

        // Plazo
        await expect(page.locator('#form_PLAZO')).toHaveValue('24');

        // Monto Apertura
        await expect(page.locator('#form_MONTO_APERTURA').first()).toHaveValue('RD$ 50');

        // Cuenta Deposito
        await page.locator(`${selectBuscar}`).last().click();

        // Deben mostrarse las cuentas de tipo Ahorros que posee el socio
        await expect(page.getByText('ORDEN DE PAGO')).toBeVisible();
        await expect(page.getByText('AHORROS POR NOMINA')).toBeVisible();

        // Elegir la cuenta de Ahorros
        await page.getByText('AHORROS NORMALES').click();

        // Cancelar el certificado
        const botonCancelar = page.getByRole('button', {name: 'Cancelar'});
        await expect(botonCancelar).toBeVisible();
        await botonCancelar.click();

        // Debe salir un modal para confirmar la cancelacion
        await expect(page.locator('text=Confirmación')).toBeVisible();

        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte de cancelacion de certificado
        await page1.close();

        // Regresar a la pagina anterior y se debe mostrar un mensaje de que se cancelo correctamente el certificado
        await expect(page.locator('span').filter({hasText: 'Operación exitosa'})).toBeVisible();

        // Click en Aceptar para cerrar el mensaje de confirmacion
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test('Confirmar que la Cuenta de Certificado del Socio se cancelo correctamente - Ir a la opcion de Certificados', async () => {
        // Apertura de cuentas
        await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();

        // Certificados
        await page.getByRole('menuitem', {name: 'Certificados'}).first().click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cuentas_certificados}`);
    });

    test('Confirmar que la Cuenta de Certificado del Socio se cancelo correctamente - Elegir un tipo de captacion', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();

        // El titulo de tipo de captaciones debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();
            
        // Boton de seleccionar captaciones
        const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
        await expect(botonCaptaciones).toBeVisible();
        // Click al boton
        await botonCaptaciones.click();

        // Click a la opcion de Financieros Pagaderas
        const opcionFinancierosPagaderas = page.locator('text=FINANCIEROS PAGADERAS');
        await expect(opcionFinancierosPagaderas).toBeVisible();
        await opcionFinancierosPagaderas.click();

        // La URL debe de cambiar al elegir el tipo de captacion
        await expect(page).toHaveURL(`${url_cuentas_certificados_financieros_pagaderas}`);

        // El tipo de captacion de Financieros PAGADERAS debe estar visible
        await expect(page.locator('#form').getByTitle('FINANCIEROS PAGADERAS')).toBeVisible();
    });

    test('Buscar al cuenta del Socio en los Certificados Activos', async () => {
        // Buscar al socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // No debe mostrar resultados
        await expect(page.getByText('No data')).toBeVisible();
    });

    test('Buscar al cuenta del Socio en los Certificados Cancelados', async () => {
        // Elegir el filtro de Canceladas
        await page.getByText('Canceladas', {exact: true}).click();

        // Debe mostrarse el certificado cancelado
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // El estado debe ser Cancelado
        await expect(page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('cell', {name: 'CANCELADO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})