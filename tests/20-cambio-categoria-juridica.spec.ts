import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con el Cambio de Categoria de la Persona Juridica', () => {
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

    test('Ir a la seccion de Solicitar Cambio Categoria', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solicitar cambio categoria
        await page.getByRole('menuitem', {name: 'Solicitar cambio categoría'}).click();

        // La URL debe cambiar 
        await expect(page).toHaveURL(`${url_base}/solicitar_cambio_categoria/01-2-2-100/`);
    });

    test('Solicitar Cambio de Categoria', async () => {
        // Nombre de la persona juridica
        const nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombreJuridica'));

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITAR CAMBIO DE CATEGORÍA'})).toBeVisible();

        // Boton Agregar
        const botonAgregar = page.getByRole('button', {name: 'Agregar'});
        await expect(botonAgregar).toBeVisible();
        await botonAgregar.click();

        // Debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'AGREGAR SOLICITUD PARA CAMBIO DE CATEGORÍA'})).toBeVisible();

        // Buscar un socio
        await page.locator('#select-search').fill(`${nombreEmpresa}`);
        // Elegir al socio
        await page.getByText(`${nombreEmpresa}`).click();

        // La categoria actual debe ser Microempresarial
        await expect(page.getByText('MICROEMPRESARIAL')).toBeVisible();

        // Via Cobro
        await page.locator('#form_VIA_COBRO').click();
        // Elegir Debito a cuenta
        await page.getByText('DEBITO A CUENTA').click();

        // Cuenta Cobro
        await page.locator('#form_ID_CUENTA_COBRO').click();
        // Elegir la cuenta de ahorros
        await page.getByText('AHORROS NORMALES').click();

        // Categoria Solicitada
        await page.locator('form_ID_CATEGORIA_SOCIO').click();
        // Elegir la categoria empresarial
        await page.getByText('EMPRESARIAL').click();

        // Comentario
        await page.locator('#form_COMENTARIO').fill('CAMBIO DE SOCIO MICROEMPRESARIAL A SOCIO EMPRESARIAL');

        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Debe salir un mensaje de confirmacion
        await expect(page.getByText('Categoria cta. socio almacenado exitosamente.')).toBeVisible();
    });

    test('Ir a la opcion de Aceptar/Rechazar Cambio Categoria', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Aceptar/Rechazar Cambio Categoría
        await page.getByRole('menuitem', {name: 'Aceptar/Rechazar Cambio Categoría'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/aceptar_rechazar_cambio_categoria/01-2-3-3/`);
    });

    test('Confirmar Cambio Categoria', async () => {
        // Nombre de la empresa
        const nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombreJuridica'));

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AUTORIZACIÓN CAMBIO CATEGORÍA'})).toBeVisible();

        // Buscar al socio
        await page.locator('#form_search').fill(`${nombreEmpresa}`);
        // Click al boton de buscar
        await page.locator('[aria-label="search"]').click();

        // Click a confirmar cambio de categoria
        await page.getByRole('row', {name: 'CAROLA ORELLANA	SOCIO EMPRESARIAL CAMBIO DE SOCIO MICROEMPRESARIAL A EMPRESARIAL'}).locator('[data-icon="check-circle"]').click();

        // Debe salir un modal
        await expect(page.locator('h1').filter({hasText: '¿Seguro que desea aprobar el cambio de categoria?'})).toBeVisible();

        // Fecha de aprobacion
        await page.locator('#FECHA_APROBACION').fill(`${formatDate(new Date())}`);

        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        // Esperar que se abra una nueva pestaña el contrato de la persona
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);

        // Cerrar la pagina con el contrato de la persona
        await newPage.close();

        // Volver a la pagina, y ya no debe estar la solicitud
        await expect(page.getByText('No hay datos')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
