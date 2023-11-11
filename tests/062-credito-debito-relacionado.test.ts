import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { diaActualFormato } from './utils/functions/fechas';
import { selectBuscar } from './utils/data/inputsButtons';
import { url_base, url_notas_cuentas } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Credito a la Cuenta de Certificado - Financieros Pagaderas', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
    });

    test('Ir a la opcion de Credito a Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Credito a Cuenta
        await page.getByRole('menuitem', {name: 'Crédito/Debito a Cuenta'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_notas_cuentas}`);
    });

    test('Ingresar un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CRÉDITO/DEBITO A CUENTA'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Selccionar una cuenta del socio
        await page.locator('text=AHORROS NORMALES').click();

        // El nombre del socio debe estar visible
        await expect(page.locator('#form_NOMBRES')).toHaveValue(`${nombre} ${apellido}`);

        // Tipo de captacion
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');

        // Sucursal
        await expect(page.locator('#form_DESC_CENTRO')).toHaveValue('OFICINA PRINCIPAL');

        // Balance
        await expect(page.locator('#form_BALANCE')).toHaveValue('150,000.00');

        // Pignorado
        await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('0.00');

        // Transito
        await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue('0.00');

        // Disponible
        await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue('150,000.00');
    });

    test('Hacer el movimiento de la Nota de Credito', async () => {
        // Monto
        await page.locator('#form_MONTO_MOVIMIENTO').fill('5000');

        // Tipo Movimiento
        await page.locator('#form_ORIGEN_MOVIMIENTO').click();
        // Elegir credito a cuenta
        await page.getByRole('option', {name: 'NOTA CREDITO'}).click();

        // Concepto
        await page.locator('#form_ID_TIPO_CONCEPTO').click();
        // Seleccionar Aplicacion de deposito
        await page.locator('text=APLICACION DE DEPOSITO').click();

        // Fecha documento
        await expect(page.locator('#form_FECHA_DOCUMENTO')).toHaveValue(`${diaActualFormato}`);

        // Comentario
        await page.getByPlaceholder('Comentario de la nota').fill('Ingreso de 5000 pesos a la cuenta de Ahorros Normales');
    });

    test('Aplicar la nota de Credito a la Cuenta', async () => {
        // Boton Guadar
        const botonGuadar = page.getByRole('button', {name: 'Aplicar nota'});
        await expect(botonGuadar).toBeVisible();
        await botonGuadar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();

        // Debe mostrarse un mensaje modal
        await expect(page.locator('text=Se ha aplicado la nota a la cuenta')).toBeVisible();

        // Click al boton de Aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test('Hacer el movimiento de la Nota de Debito', async () => {
        // Click al selector de socio
        await page.locator(`${selectBuscar}`).click();
        // Seleccionar la cuenta de Ahorros Normales nuevamente
        await page.locator('text=AHORROS NORMALES').click();

        // Monto
        await page.locator('#form_MONTO_MOVIMIENTO').fill('3500');

        // Tipo Movimiento
        await page.locator('#form_ORIGEN_MOVIMIENTO').click();
        // Elegir credito a cuenta
        await page.getByRole('option', {name: 'NOTA DEBITO'}).click();

        // Concepto
        await page.locator('#form_ID_TIPO_CONCEPTO').click();
        // Seleccionar Aplicacion de deposito
        await page.locator('text=Ajuste Balance').click();

        // Fecha documento
        await expect(page.locator('#form_FECHA_DOCUMENTO')).toHaveValue(`${diaActualFormato}`);

        // Comentario
        await page.getByPlaceholder('Comentario de la nota').fill('Retiro de 3500 pesos de la cuenta de Ahorros Normales');
    });

    test('Aplicar la nota de Debito a la Cuenta', async () => {
        // Boton Guadar
        const botonGuadar = page.getByRole('button', {name: 'Aplicar nota'});
        await expect(botonGuadar).toBeVisible();
        await botonGuadar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();

        // Debe mostrarse un mensaje modal
        await expect(page.locator('text=Se ha aplicado la nota a la cuenta')).toBeVisible();

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
