import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, ariaCerrar, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con el Pago a Prestamos (Transferencias)', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser= await chromium.launch({
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

        // Cedula, nombre y apellido de la persona
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Transferencias Cuentas Internas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transferencias Cuentas Internas
        await page.getByRole('menuitem', {name: 'Pago a préstamos (transferencia)'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/pago_prestamos/01-2-2-108/`);
    });

    test('Transferir fondo de la Cuenta de Ahorros al Prestamo', async () => {
        // El titulo prinicipal debe estar presente
        await expect(page.locator('h1').filter({hasText: 'PAGO A PRÉSTAMOS (TRANSFERENCIA)'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).first().fill(`${nombre} ${apellido}`);
        // Seleccionar la cuenta de ahorros del socio
        await page.getByText('AHORROS NORMALES').click();

        // Buscar la cuenta de aportaciones preferentes
        await page.locator(`${selectBuscar}`).last().fill(`${nombre} ${apellido}`);
        // Seleccionar el prestamo del socio
        await page.getByText('PRESTAMOS |').click();

        // Titulo detalle de la transaccion
        await expect(page.locator('h1').filter({hasText: 'Detalle De La Transacción'})).toBeVisible();

        // Ingresar un monto
        await page.locator('#form_MONTO').fill('1000');

        // Agregar un comentario
        await page.locator('#form_DESCRIPCION').fill('Pago al prestamo de 1000 mediante una transferencia desde la cuenta de ahorros');

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
        test.slow();
        
        // Boton Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        // Click al boton
        await botonFinalizar.click();

        // Debe salir un modal de confirmacion
        await expect(page.getByText('¿Está seguro que desea confirmar transferencia?')).toBeVisible();

        // Boton Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        // Esperar que se abra una nueva pestaña con el reporte de la transferencia
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
        
        // Cerrar la pagina con el reporte 
        await newPage.close();

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