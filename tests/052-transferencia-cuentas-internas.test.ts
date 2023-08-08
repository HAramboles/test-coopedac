import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, ariaCerrar, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pruebas con la Transferencia de Cuentas de un Socio', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser= await chromium.launch({
            headless: false,
            args: ['--window-position=-1300,100'],
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
    });

    test('Ir a la opcion de Transferencias Cuentas Internas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transferencias Cuentas Internas
        await page.getByRole('menuitem', {name: 'Transferencias Cuentas Internas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/transferencia_cuenta/01-2-2-104/`);
    });

    test('Transferir fondo de la Cuenta de Ahorros a la cuenta de Aportaciones Preferentes', async () => {
        // El titulo prinicipal debe estar presente
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIAS CUENTAS INTERNAS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).first().fill(`${cedula}`);

        // Deben mostrarse todas las cuentas de tipo Ahorro que posee el socio
        const cuentaAhorrosNormales = page.getByText('AHORROS NORMALES');
        const cuentaAhorrosNomina = page.getByText('AHORROS POR NOMINA');
        const cuentaOrdenPago = page.getByText('ORDEN DE PAGO');

        await expect(cuentaAhorrosNormales).toBeVisible();
        await expect(cuentaAhorrosNomina).toBeVisible();
        await expect(cuentaOrdenPago).toBeVisible();

        // Seleccionar la cuenta de ahorros del socio
        await page.getByText('AHORROS NORMALES').click();

        // Buscar la cuenta de aportaciones 
        await page.locator(`${selectBuscar}`).last().fill(`${cedula}`);

        // Deben salir las cuentas de tipo Ahorro y la de Aportaciones
        await expect(cuentaAhorrosNomina).toBeVisible();
        await expect(cuentaOrdenPago).toBeVisible();
        await expect(page.getByText('APORTACIONES')).toBeVisible();

        // Seleccionar la cuenta de Aportaciones del socio
        await page.getByText('APORTACIONES').click();

        // Titulo detalle de la transaccion
        await expect(page.locator('h1').filter({hasText: 'Detalle De La Transacción'})).toBeVisible();

        // Ingresar un monto
        await page.locator('#form_MONTO').fill('1000');

        // Agregar un comentario
        await page.locator('#form_DESCRIPCION').fill('Transferencia a la Cuenta de Aportaciones');

        // Click en siguiente
        await page.getByRole('button', {name: 'Siguiente'}).click();
    });

    test('Probar el boton de Anterior', async () => {
        // Boton Anterior
        const botonAnterior = page.getByRole('button', {name: 'Anterior'});
        await expect(botonAnterior).toBeVisible();
        // Click al boton
        await botonAnterior.click();

        // Debe regresar a la pagina anterior por lo que el titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIAS CUENTAS INTERNAS'})).toBeVisible();

        // Debe estar visible el titulo secundario
        await expect(page.locator('h1').filter({hasText: 'Detalle de la Transacción'})).toBeVisible();

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
        await expect(page.getByPlaceholder('MONTO')).toHaveValue('RD$ 1,000');

        // Comentario
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES')).toBeVisible();
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

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();

        // Se debe regresar a la pagina
        await expect(page).toHaveURL(`${url_base}/transferencia_cuenta/01-2-2-104/`);

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