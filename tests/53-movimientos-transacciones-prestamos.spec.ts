import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';
import { formatDate, primerDiaMes } from './utils/utils';

// Variables gloabales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Puebas

test.describe('Pruebas con los Movimientos de Transacciones de un Prestamo', async () => {
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

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Movimientos Transacciones Prestamos', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Movimientos transacciones prestamos
        await page.getByRole('menuitem', {name: 'Movimientos transacciones prestamos'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/mov_trans_prest/01-3-4-6/`);
    });

    test('Prestamo del Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS TRANSACCIONES PRESTAMOS'})).toBeVisible();

        // Buscar un socio
        await page.locator('#select-search').fill(`${nombre} ${apellido}`);
        // Elegir al socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Tipo transaccion
        await page.locator('#form_ID_TIPO_DOC').click();
        // Elegir depositos
        await page.getByRole('option', {name: 'DEPOSITOS'}).click();

        // Fecha inicial, debe tener la fecha de inicio del mes
        await expect(page.locator('#form_FECHA_INICIAL')).toHaveValue(`${primerDiaMes}`);

        // Fecha final
        await expect(page.locator('#form_FECHA_FINAL')).toHaveValue(`${formatDate(new Date())}`);

        // Click al boton buscar
        await page.getByRole('button', {name: 'Buscar'}).click();
    });

    test('Cuadro de movimientos del prestamo', async () => {
        // Cuadro de los movimientos
        await expect(page.getByText('Partidas Afectadas', {exact: true})).toBeVisible();
        await expect(page.getByText('Forma de Pago', {exact: true})).toBeVisible();
        await expect(page.getByText('Oferta', {exact: true})).toBeVisible();
        await expect(page.getByText('Socios', {exact: true})).toBeVisible();
        await expect(page.getByText('Fecha', {exact: true})).toBeVisible();
        await expect(page.getByText('Tipo Transacción', {exact: true})).toBeVisible();
        await expect(page.getByText('Documento', {exact: true})).toBeVisible();
        await expect(page.getByText('Descripción', {exact: true}).first()).toBeVisible();
        await expect(page.getByText('No. transacción', {exact: true})).toBeVisible();
        await expect(page.getByText('Capital', {exact: true})).toBeVisible();
        await expect(page.getByText('Abono Capital', {exact: true})).toBeVisible();
        await expect(page.getByText('Interés', {exact: true})).toBeVisible();
        await expect(page.getByText('Mora', {exact: true})).toBeVisible();
        await expect(page.getByText('Seguro', {exact: true})).toBeVisible();
        await expect(page.getByText('Otros', {exact: true})).toBeVisible();
        await expect(page.getByText('Efectivo', {exact: true})).toBeVisible();
        await expect(page.getByText('Cheque', {exact: true})).toBeVisible();
        await expect(page.getByText('Transferencia', {exact: true})).toBeVisible();
        await expect(page.getByText('Depósito Externo', {exact: true})).toBeVisible();
        await expect(page.getByText('Recaudo', {exact: true})).toBeVisible();
    });

    test('Cuadro de Relacion de Cuentas', async () => {
        // Titulo relacion de cuentas
        await expect(page.locator('h1').filter({hasText: 'RELACIÓN DE CUENTAS'})).toBeVisible();

        // Cuadro
        await expect(page.getByText('Cuenta Contable', {exact: true})).toBeVisible();
        await expect(page.getByText('Descripción', {exact: true}).last()).toBeVisible();
        await expect(page.getByText('Débito', {exact: true})).toBeVisible();
        await expect(page.getByRole('row', {name: 'Crédito', exact: true})).toBeVisible();
    });

    test('Movimientos del Prestamo', async () => {
        // Descripcion del movimiento
        await expect(page.getByRole('cell', {name: 'NOTAS CREDITO PRESTAMOS'})).toBeVisible();

        // Abono a capital de 12,000
        await expect(page.getByRole('row', {name: '0.00 12,000.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
