import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Nombre de la presona juridica
let nombreEmpresa: string | null;

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

        // Nombre de la empresa
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombreJuridica'));
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
        await expect(page.locator('#form_DESC_CATEGORIA')).toHaveValue('SOCIO MICROEMPRESARIAL');

        // Via Cobro
        await page.locator('#form_VIA_COBRO').click();
        // Elegir Debito a cuenta
        await page.getByText('DEBITO A CUENTA').click();

        // En la cuenta de cobro se coloca automaticamente la cuenta de ahorros del socio
        await expect(page.getByText('AHORROS NORMALES')).toBeVisible();

        // En la Categoria Solicitada se coloca automaticamente la categoria Empresarial 
        await expect(page.getByTitle('SOCIO EMPRESARIAL')).toBeVisible();

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
        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Aceptar/Rechazar Cambio Categoría
        await page.getByRole('menuitem', {name: 'Aceptar/Rechazar Cambio Categoría'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/aceptar_rechazar_cambio_categoria/01-2-3-3/`);
    });

    test('Confirmar Cambio Categoria', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AUTORIZACIÓN CAMBIO CATEGORÍA'})).toBeVisible();

        // Buscar al socio
        await page.locator('#form_search').fill(`${nombreEmpresa}`);
        // Click al boton de buscar
        await page.locator('[aria-label="search"]').click();

        // Click a confirmar cambio de categoria
        await page.getByRole('row', {name: `${nombreEmpresa} SOCIO EMPRESARIAL`}).locator('[data-icon="check-circle"]').click();

        // Debe salir un modal
        await expect(page.locator('text=¿Seguro que desea aprobar el cambio de categoria?')).toBeVisible();

        // Fecha de aprobacion
        await page.locator('#FECHA_APROBACION').fill(`${formatDate(new Date())}`);

        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Deben salir dos mensajes de confirmacion
        // await expect(page.locator('text=')).toBeVisible();
        // await expect(page.locator('text=')).toBeVisible();

        // Cerrar los dos mensajes
        await page.locator('[aria-label="close"]]').first().click();
        await page.locator('[aria-label="close"]]').last().click();

        // La solicitud ya no debe estar
        await expect(page.getByText('No hay datos')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
