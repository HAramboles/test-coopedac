import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con Cobros de Oficina', () => {
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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem("apellidoPersona"));
    });

    test('Ir a la opcion de Cobros de Oficina', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Cobros de Oficina
        await page.getByRole('menuitem', {name: 'Cobros Oficina'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cobros_oficina/01-3-2-1/`);
    });

    test('Buscar un Prestamo de un Socio', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'COBROS OFICINA'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Debe estar visible el credito de la persona
        await expect(page.getByText('CRÉDITO HIPOTECARIO')).toBeVisible();

        // Hacer un pago al credito
        await page.locator('[aria-label="Expandir fila"]').click();

        // Click al boton de Pagos
        const botonPagos = page.getByText('PAGOS');
        await expect(botonPagos).toBeVisible();
        await botonPagos.click();

        // Se debe abrir un modal
        await expect(page.locator('h1').filter({hasText: 'PAGO A PRÉSTAMO'})).toBeVisible();
    });

    test('Datos Generales del Prestamo', async () => {
        // Titulo de datos generales
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Nombre de la persona
        await expect(page.locator('#form_NOMBREPERSONA')).toHaveValue(`${nombre} ${apellido}`);

        // Prestamo
        await expect(page.locator('#form_DESCOFERTA')).toHaveValue('CRÉDITO HIPOTECARIO');

        // Cuenta Cobro
        await expect(page.locator('#form_DESCRIPCION_CUENTA_COBRO')).toHaveValue('AHORROS NORMALES');

        // Cuota
        await expect(page.locator('#form_MONTOCUOTA')).toHaveValue('RD$ 416.67');

        // Garantia
        //await expect(page.getByText('Sin garantía')).toBeVisible();

        // Linea de Credito
        await expect(page.getByText('Línea de Crédito')).toBeVisible();
        await expect(page.getByText('No', {exact: true})).toBeVisible();
    });

    test('Opciones de Pago', async () => {
        // Titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'OPCIONES DE PAGO'})).toBeVisible();

        // Cuotas pendientes
        await expect(page.getByText('0 cuotas pendientes RD 0.00')).toBeVisible();

        // Adelantar cuotas
        await expect(page.getByText('Adelantar cuotas')).toBeVisible();

        // Saldo total
        await expect(page.getByText('Saldo total')).toBeVisible();

        // Saldar la mitad faltante del prestamo
        await page.locator('(//INPUT[@type="checkbox"])[4]').check();

        // El total a pagar debe ser la misma cantidad que la ingresada en el abono capital
        await expect(page.locator('text=Total a pagar')).toBeVisible();
        await expect(page.locator('#form_A_PAGAR')).toHaveValue('RD$ 13,000');

        // Agregar un comnetario
        await page.locator('#form_COMENTARIO').fill('Pagar 13,000, lo faltante, al prestamo');

        // Ocultar los detalles de pago
        await page.getByText('Detalle de Pago').click();
    });

    test('Enviar a Caja', async () => {
        // Via de cobro
        await expect(page.locator('text=Vía de cobro')).toBeVisible();

        // Elegir la opcion de enviar a caja
        await expect(page.getByText('Enviar a Caja')).toBeVisible();
        await page.locator('(//INPUT[@type="radio"])[1]').click();

        // Seleccionar una caja
        await page.locator('div').filter({hasText: /^TODOS - TODOS$/}).nth(4).click();
        // Elegir la primera caja que se muestre
        await page.getByRole('option').nth(1).click();
    });

    test('Realizar el pago', async () => {
        // Boton Aplicar
        const botonAplicar = page.getByRole('button', {name: 'Aplicar'});
        await expect(botonAplicar).toBeVisible();
        await botonAplicar.click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});