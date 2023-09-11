import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, selectBuscar, dataEliminar, fechaInicio, fechaFinal } from './utils/dataTests';
import { formatDate } from './utils/fechas';
import { url_anular_nota_credito_prestamo } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la empresa
let nombreEmpresa: string | null;

// Pruebas
test.describe.serial('Pruebas Anulando una Nota Credito Prestamo', async () => {
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

        // Nombre de la persona juridica alamcenada en el state
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
    });

    test('Ir a la pagina de Anular Nota Credito Prestamo', async () => {
        // NEGOCIOS
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // ANULACIONES
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Nota Credito Prestamo
        await page.getByRole('menuitem', {name: 'Anular Nota Crédito Préstamo'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_nota_credito_prestamo}`);
    });

    test('Buscar la Nota de Credito al Prestamo', async () => {
        // Titulo de la pagina
        await expect(page.locator('h1').filter({hasText: 'ANULAR NOTA DE CRÉDITO A PRÉSTAMO'})).toBeVisible();

        // Criterio de Busqueda
        await expect(page.getByText('Criterio de búsqueda')).toBeVisible();

        // Tipo de Tranasaccion
        await expect(page.getByTitle('NP - NOTAS PRPESTAMOS')).toBeVisible();

        // ID Documento
        await expect(page.locator('#form_ID_DOCUMENTO')).toBeVisible();

        // Prestamo
        await expect(page.locator(`${selectBuscar}`)).toBeVisible();

        // Fecha documento inicio
        await expect(page.locator(`${fechaInicio}`)).toHaveValue(`${formatDate(new Date())}`);

        // Fecha documento final
        await expect(page.locator(`${fechaFinal}`)).toHaveValue(`${formatDate(new Date())}`);

        // Usuario
        await page.locator('#form_USUARIO_INSERCION').click();
        // Elegir la primera opcion que aparece
        await page.locator('text=BPSH').nth(0).click();

        // Click al boton de Buscar
        await page.getByRole('button', {name: 'Buscar'}).click();
    });

    test('Anular la Nota de Credito al Prestamo Crediauto de la Persona Juridica', async () => {
        // Nota Credito al Prestamo
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();

        // Concepto
        await expect(page.getByRole('cell', {name: 'ABONO A CAPITAL'})).toBeVisible();

        // Monto Ingreso
        await expect(page.getByRole('cell', {name: 'RD$ 125,000.00'})).toBeVisible();

        // Boton Eliminar
        await page.getByRole('row', {name: `${nombreEmpresa}`}).locator(`${dataEliminar}`).click();

        // Aparece un modal
        await expect(page.locator('text=Motivo de la Anulación')).toBeVisible();

        // Colocar una razon de la anulacion en el input de comentario
        await page.locator('#fform_CONCEPTO_ANULACION').fill('Nota Credito a Prestamo Rechazada');

        // Click al boton Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Aparece un mensaje modal de operacion exitosa
        const modalOperacionExitosa = page.locator('text=Operación Exitosa');
        await expect(modalOperacionExitosa).toBeVisible();

        // Click al boton de Aceptar del mensaje modal
        await modalOperacionExitosa.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
