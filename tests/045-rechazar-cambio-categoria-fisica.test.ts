import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formBuscar, formComentario } from './utils/data/inputsButtons';
import { url_base, url_aceptar_rechazar_cambio_categoria } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la presona fisica
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Rechazo de Cambio de Categoria de la Persona Fisica', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);
        
        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la pesona alamacenada en el state
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
        await expect(page).toHaveURL(`${url_aceptar_rechazar_cambio_categoria}`);
    });

    test('Cancelar Cambio Categoria', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AUTORIZACIÓN CAMBIO CATEGORÍA'})).toBeVisible();

        // Buscar al socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
        // Click al boton de buscar
        await page.locator('[aria-label="search"]').click();

        // Esperar a que se muestre la persona buscada
        await page.waitForTimeout(2000);

        // Debe estar visible la tabla con las solicitudes
        await expect(page.getByRole('columnheader', {name: 'Id Socio'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Titular'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Categoría anterior'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Categoría Solicitada'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Comentario'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Acciones'})).toBeVisible();

        // Deben mostrarse la categoria actual y la solicitada
        await expect(page.getByRole('cell', {name: 'SOCIO AHORRANTE', exact: true})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'SOCIO MICROEMPRESARIAL', exact: true})).toBeVisible();

        // La solicitud del socio debe estar visible
        const solicitudCreada = page.getByRole('row', {name: `${nombre} ${apellido} SOCIO AHORRANTE SOCIO MICROEMPRESARIAL`});
        await expect(solicitudCreada).toBeVisible();

        // Click a confirmar cambio de categoria
        await solicitudCreada.locator('[data-icon="stop"]').click();

        // Debe salir un modal
        await expect(page.locator('text=Motivo de Rechazo')).toBeVisible();

        // Debe aparecer un mensaje informativo en el modal de rechazo
        await expect(page.getByText(`Escriba la razón de rechazo de la solicitud de cambio de categoría de ${nombre} ${apellido}, de SOCIO AHORRANTE a SOCIO MICROEMPRESARIAL`)).toBeVisible();

        // Colocar un comentario
        await page.locator(`${formComentario}`).fill('Cambio de opinion del Socio');

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
