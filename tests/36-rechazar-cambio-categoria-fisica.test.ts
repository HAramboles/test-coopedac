import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la presona juridica
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con el Rechazo de Cambio de Categoria de la Persona Fisica', async () => {
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

        // Nombre de la empresa almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
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

    test('Cancelar Cambio Categoria', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AUTORIZACIÓN CAMBIO CATEGORÍA'})).toBeVisible();

        // Buscar al socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
        // Click al boton de buscar
        await page.locator('[aria-label="search"]').click();

        // La solicitud del socio debe estar visible
        const solicitudCreada = page.getByRole('row', {name: `${nombre} ${apellido} SOCIO MICROEMPRESARIAL`});
        await expect(solicitudCreada).toBeVisible();

        // Click a confirmar cambio de categoria
        await solicitudCreada.locator('[data-icon="stop"]').click();

        // Debe salir un modal
        await expect(page.locator('text=Motivo de Rechazo')).toBeVisible();

        // Colocar un comentario
        await page.locator('#form_COMENTARIO').fill('Cambio de opinion del Socio');

        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Debe mostrarse una alerta de Operacion Exitosa
        await expect(page.locator('text=Categoria cta. socio actualizado exitosamente')).toBeVisible();

        // La solicitud del socio ya no debe mostrarse
        await expect(solicitudCreada).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
