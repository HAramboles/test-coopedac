import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { diaActualFormato } from './utils/functions/fechas';
import { formBuscar, dataCheck } from './utils/data/inputsButtons';
import { url_base, url_aceptar_rechazar_cambio_categoria } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre de la presona juridica
let cedulaEmpresa: string | null;
let nombreEmpresa: string | null;

// Pruebas
test.describe.serial('Pruebas con la Confirmacion de Cambio de Categoria de la Persona Juridica', async() => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);
        
        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula y nombre de la persona juridica almacenada en el state
        cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
    });

    test('Ir a la opcion de Aceptar/Rechazar Cambio Categoria', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
        
        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Aceptar/Rechazar Cambio Categoría
        await page.getByRole('menuitem', {name: 'Aceptar/Rechazar Cambio Categoría'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_aceptar_rechazar_cambio_categoria}`);
    });

    test('Confirmar Cambio Categoria', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AUTORIZACIÓN CAMBIO CATEGORÍA'})).toBeVisible();

        // Buscar al socio
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);
        // Click al boton de buscar
        await page.locator('[aria-label="search"]').click();

        // Click a confirmar cambio de categoria
        await page.getByRole('row', {name: `${nombreEmpresa} SOCIO EMPRESARIAL`}).locator(`${dataCheck}`).click();

        // Debe salir un modal
        await expect(page.locator('text=¿Seguro que desea aprobar el cambio de categoria?')).toBeVisible();

        // Fecha de aprobacion
        await page.locator('#FECHA_APROBACION').fill(`${diaActualFormato}`);

        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Aparece una alerta de operacion exitosa
        await expect(page.locator('text=Categoria cta. socio actualizado exitosamente')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
