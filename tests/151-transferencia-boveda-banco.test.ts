import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, url_transferencia_boveda_banco } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { formComentario } from './utils/data/inputsButtons';

/* Variables globales */
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con la Transferencia de Boveda a Banco', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Transferencia Banco', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Boveda
        await page.getByRole('menuitem', {name: 'BOVEDA'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transferencia a Banco
        await page.getByRole('menuitem', {name: 'Transferencia Banco'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_transferencia_boveda_banco}`)
    });

    test('Seleccionar un Banco para hacer la Transferencia', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIA BANCO'})).toBeVisible();

        // Por defecto debe estar seleccionda la boveda principal
        await expect(page.getByTitle('BOVEDA PRINCIPAL')).toBeVisible();

        // Click al selector de Banco
        await page.locator('#form_ID_BANCO').click();

        // Elegir el banco Alaver
        await page.getByRole('option', {name: 'ALAVER'}).click();

        // El banco Alaver debe haberse seleccionado
        await expect(page.locator('#form').getByTitle('ALAVER -')).toBeVisible();

        // Digitar un comentario
        await page.locator(`${formComentario}`).fill('Transferir 1000 pesos a Alaver');
    });

    test('Realizar la Transferencia al Banco', async () => {
        // Debe estar visible la tabla de las denominaciones de la boveda
        await expect(page.getByRole('heading', {name: 'Denominaciones BOVEDA'})).toBeVisible();
        
        // Debe estar visible la tabla de lo entregado
        await expect(page.getByRole('heading', {name: 'Entregado'})).toBeVisible();

        // Entregar 1 de 1000 pesos

        // Campo de RD 1000
        const cant1000 = page.locator('(//input[@id="CANTIDAD_DIGITADA"])[2]'); 

        // Cantidad = 1
        await cant1000.fill('1');
        
        // Esperar a que se agregue la cantidad digitada
        await page.waitForTimeout(1000);

        // Click al boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Aparece un modal de confirmacion
        const modalConfirmacion = page.getByText('Confirmar transferencia a banco.');
        await expect(modalConfirmacion).toBeVisible();

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se abre una nueva pagina con el reporte de la transferencia
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina
        await page1.close();

        // Debe regresar a la pagina de Transferencia a Banco
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIA BANCO'})).toBeVisible();

        // El modal de confirmacion no debe estar visible
        await expect(modalConfirmacion).not.toBeVisible();

        // En la pagin aparece un mensaje modal de operacion exitosa
        await expect(page.getByText('Transferencia a banco realizada con éxito.')).toBeVisible();

        // Click al boton de Aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});