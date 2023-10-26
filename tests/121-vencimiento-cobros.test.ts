import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, contextConfig } from './utils/dataTests';
import { url_vencimiento_cobros } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con el Vencimiento de Cobros', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ingresar a la pagina de Vencimiento de Cobros', async () => {
        // NEGOCIOS
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // CONSULTAS
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Vencimiento de Cobros
        await page.getByRole('menuitem', {name: 'Vencimiento de Cobros'}).click();

        // La URL de la pagina
        await expect(page).toHaveURL(`${url_vencimiento_cobros}`);
    });

    test('Llenar los campos de la pagina de Vencimiento de Cobros', async () => {
        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'VENCIMIENTO DE COBROS'})).toBeVisible();

        // Elegir una sucursal
        await page.locator('#form_ID_CENTRO_COSTO').click();
        // Opciones de sucursal
        const oficinaPrincipal = page.getByRole('option', {name: 'OFICINA PRINCIPAL'});
        await expect(oficinaPrincipal).toBeVisible();
        await expect(page.getByRole('option', {name: 'OFICINA EMPO'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'INFORMES'})).toBeVisible();

        // Click a la sucursal Oficina Principal
        await oficinaPrincipal.click();

        // Buscar un grupo
        const selectorGrupo = page.locator('#form_ID_GRUPO');
        await selectorGrupo.click();
        await selectorGrupo.fill('sin garan');

        // Elegir el grupo buscado
        await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

        // Elegir un tipo de prestamo
        await page.locator('#form_ID_TIPO_TRANS_PREST').click();
        // Opciones de tipo de prestamo
        const prestamosHipotecario = page.getByRole('option', {name: 'PRESTAMOS HIPOTECARIOS'});
        await expect(prestamosHipotecario).toBeVisible();
        await expect(page.getByRole('option', {name: 'PRESTAMOS COMERCIALES'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'PRESTAMOS PERSONALES'})).toBeVisible();

        // Click el tipo de prestamo Prestamos Hipotecarios
        await prestamosHipotecario.click();

        // Buscar un ejecutivo
        const selectorEjecutivo = page.locator('#form_ID_EJECUTIVO');
        await selectorEjecutivo.click();
        await selectorEjecutivo.fill('cliente inac');

        // Elegir el ejecutivo buscado
        await page.getByRole('option', {name: 'CLIENTE INACTIVO'}).click();

        // Elegir una cartera
        await page.locator('#form_ID_CARTERA').click();
        // Opciones de cartera
        const carteraBanca = page.getByRole('option', {name: 'BANCA'});
        await expect(carteraBanca).toBeVisible();

        // Click a la Cartera Banca
        await carteraBanca.click();

        // Elegir un tipo de oferta financiera
        await page.locator('#form_ID_OFERTA').click();
        // Opciones de oferta financiera
        const creditoHipotecario = page.getByRole('option', {name: 'CRÉDITO HIPOTECARIO'});
        await expect(creditoHipotecario).toBeVisible();
        await expect(page.getByRole('option', {name: 'HIPOTECARIO VIP PLUS'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'CRÉDITO VIVIENDA NUEVA'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'CRÉDITO VIVIENDA USADA'})).toBeVisible();

        // Click al tipo de oferta financiera Credito Hipotecario
        await creditoHipotecario.click();

        // Elegir un tipo de garantia
        await page.locator('#form_ID_GARANTIA').click();
        // Opciones de garantia
        const garantiaHipoteca = page.getByRole('option', {name: 'HIPOTECA', exact: true});
        await expect(garantiaHipoteca).toBeVisible();

        // Click al tipo de garantia Hipoteca
        await garantiaHipoteca.click();
    });

    test('Imprimir el Reporte de Vencimiento de Cobros', async () => {
        // Boton de Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();

        // Click al boton de Imprimir
        await botonImprimir.click();

        // Se abre una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
