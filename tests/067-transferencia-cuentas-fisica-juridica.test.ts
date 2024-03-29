import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { ariaCerrar, selectBuscar } from './utils/data/inputsButtons';
import { url_base, url_transferencia_cuentas } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona fisica
let cedulaPersona: string | null;

// Cedula y nombre de la persona juridica
let cedulaEmpresa: string | null;
let nombreEmpresa: string | null;

// Pruebas
test.describe.serial('Pruebas con la Transferencia de Cuentas de un Socio', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser= await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula de la persona fisica almacenada en el state
        cedulaPersona = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));

        // Cedula y nombre de la persona juridica almacenada en el state
        cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
    });

    // Funcion para cerrar las paginas de reportes
    const CerrarPaginasReportes = async () => {
        context.on('page', async (page) => {
            await page.waitForTimeout(1000);
            await page.close();
        });
    };
    
    test('Ir a la opcion de Transferencias Cuentas Internas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transferencias Cuentas Internas
        await page.getByRole('menuitem', {name: 'Transferencias Cuentas Internas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_transferencia_cuentas}`);
    });

    test('Transferir fondo de la Cuenta de Ahorros de la persona a la cuenta de Ahorros Normales de la persona relacionada', async () => {
        // El titulo prinicipal debe estar presente
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIAS CUENTAS INTERNAS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).first().fill(`${cedulaPersona}`);

        // Deben mostrarse todas las cuentas de tipo Ahorro que posee el socio
        const cuentaAhorrosNormales = page.getByText('AHORROS NORMALES');
        const cuentaAhorrosNomina = page.getByText('AHORROS POR NOMINA');
        const cuentaOrdenPago = page.getByText('ORDEN DE PAGO');

        await expect(cuentaAhorrosNormales).toBeVisible();
        await expect(cuentaAhorrosNomina).toBeVisible();
        await expect(cuentaOrdenPago).toBeVisible();

        // Seleccionar la cuenta de ahorros del socio
        await page.getByText('AHORROS NORMALES').click();

        // Buscar la cuenta de ahorros normales de la persona juridica
        await page.locator(`${selectBuscar}`).last().fill(`${cedulaEmpresa}`);

        // Deben salir la cuenta de ahorros normales y la de aportaciones de la persona relacionada
        await expect(page.getByRole('option', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByText('APORTACIONES')).toBeVisible();

        // Seleccionar la cuenta de Ahorros Normales del socio
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Titulo detalle de la transaccion
        await expect(page.locator('h1').filter({hasText: 'Detalle De La Transacción'})).toBeVisible();

        // Ingresar un monto
        await page.locator('#form_MONTO').fill('1500');

        // Agregar un comentario
        await page.locator('#form_DESCRIPCION').fill(`Transferencia a la cuenta de Ahorros Normales de ${nombreEmpresa}`);

        // Click en siguiente
        await page.getByRole('button', {name: 'Siguiente'}).click();
    });

    test('Resumen de la Transaccion', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'RESUMEN DE LA TRANSACCIÓN'})).toBeVisible();

        // Origen
        await expect(page.getByText('Origen')).toBeVisible();

        // Destino
        await expect(page.getByText('Destino')).toBeVisible();

        // Monto
        await expect(page.getByPlaceholder('MONTO')).toHaveValue('RD$ 1,500');

        // Comentario
        await expect(page.getByText(`Transferencia a la cuenta de Ahorros Normales de ${nombreEmpresa}`)).toBeVisible();
    });

    test('Finalizar con la Transferencia entre Cuentas', async () => {
        // Boton Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        // Click al boton
        await botonFinalizar.click();

        // Debe salir un modal de confirmacion
        await expect(page.getByText('¿Está seguro que desea confirmar transferencia?')).toBeVisible();

        // Boton Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Debe abrirse una nueva ventana con el reporte de la transferencia
        CerrarPaginasReportes();

        // Se debe regresar a la pagina
        await expect(page).toHaveURL(`${url_transferencia_cuentas}`);

        // Se debe mostrar un mensaje de Opercaion Exitosa
        await expect(page.locator('text=Captacion Movimiento almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator(`${ariaCerrar}`).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerra la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});