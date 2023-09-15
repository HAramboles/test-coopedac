import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/fechas';
import { url_base, ariaCerrar, selectBuscar, browserConfig, formComentario } from './utils/dataTests';
import { url_notas_cuentas } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Debito a la Cuenta de Certificado - Financieros Pagaderas', () => {
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

        // Cedula, nombre y apellido de la persona
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
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
        await page.locator('text=FINANCIEROS PAGADERAS').click();

        // El nombre del socio debe estar visible
        await expect(page.locator('#form_NOMBRES')).toHaveValue(`${nombre} ${apellido}`);

        // Tipo de captacion
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('FINANCIEROS PAGADERAS');

        // Sucursal
        await expect(page.locator('#form_sucursal')).toHaveValue('OFICINA PRINCIPAL');

        // Balance
        await expect(page.locator('#form_BALANCE')).toHaveValue(' 2,100.00');

        // Pignorado
        await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue(' 0.00');

        // Transito
        await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue(' 600.00');

        // Disponible
        await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue(' 1,500.00');
    });

    test('Hacer el movimiento', async () => {
        // Monto
        await page.locator('#form_MONTO').fill('600');
        
        // Tipo Movimiento
        await page.locator('#form_ORIGEN_MOVIMIENTO').click();
        // Elegir credito a cuenta
        await page.getByRole('option', {name: 'NOTA DEBITO'}).click();

        // Concepto
        await page.locator('#form_ID_TIPO_CONCEPTO').click();
        // Seleccionar Aplicacion de deposito
        await page.locator('text=Ajuste Balance').click();

        // Fecha documento
        await expect(page.locator('#form_FECHA_DOCUMENTO')).toHaveValue(`${formatDate(new Date())}`);

        // Comentario
        await page.locator(`${formComentario}`).fill('Debito de 600 pesos a la cuenta de Certificado');
    });

    test('Realizar el Debito a la Cuenta', async () => {
        // Boton Guadar
        const botonGuadar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuadar).toBeVisible();
        await botonGuadar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Esperar que el reporte este visible
        await page1.waitForTimeout(4000);

        // Cerrar la pagina con el reporte
        await page1.close();

        // Se deben mostrar dos mensajes de confirmacion
        await expect(page.locator('text=Captacion Movimiento almacenada exitosamente.')).toBeVisible();

        // Cerrar los mensajes
        await page.locator(`${ariaCerrar}`).first().click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
