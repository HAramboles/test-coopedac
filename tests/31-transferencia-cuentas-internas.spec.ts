import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con la Transferencia de Cuentas de un socio', () => {
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
        // Cedula, nombre y apellido de la persona
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El titulo prinicipal debe estar presente
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIAS CUENTAS INTERNAS'})).toBeVisible();

        // Buscar un socio
        await page.locator('#select-search').first().fill(`${cedula}`);
        // Seleccionar el socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Deben estar visible la cuenta seleccionada (ahorros), el nombre y la cedula de la persona
        await expect(page.getByText('AHORROS NORMALES')).toBeVisible();
        await expect(page.getByText(`${nombre} ${apellido}`)).toBeVisible();
        await expect(page.getByText(`${cedula}`)).toBeVisible();

        // Balance
        await expect(page.getByText('50,400.00')).toBeVisible();

        // Balance Disponible
        await expect(page.getByText('50,200.00')).toBeVisible();

        // Buscar la cuenta de aportaciones preferentes
        await page.locator('#select-search').last().fill(`${cedula}`);
        // Seleccionar la cuenta de Aportaciones Preferentes del socio
        await page.getByText('APORTACIONES PREFERENTES', {exact: true}).click();

        // Deben estar visible la cuenta seleccionada (aportaciones preferentes)
        await expect(page.getByText('AHORROS NORMALES')).toBeVisible();

        // Titulo detalle de la transaccion
        await expect(page.locator('h1').filter({hasText: 'Detalle De La Transacción'})).toBeVisible();

        // Ingresar un monto
        await page.locator('#form_MONTO').fill('2000');

        // Agregar un comentario
        await page.locator('#form_DESCRIPCION').fill('Transferencia a la Cuenta de Aportaciones Preferentes');

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

        // Deben estar visibles la cuenta de origen y de la destino de la transferencia
        await expect(page.getByText('AHORROS NORMALES')).toBeVisible();
        await expect(page.getByText('APORTACIONES PREFERENTES')).toBeVisible();

        // Click en siguiente
        await page.getByRole('button', {name: 'Siguiente'}).click();
    });

    test('Resumen de la Transaccion', async () => {
        // Cedula, nombre y apellido de la persona
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'RESUMEN DE LA TRANSACCIÓN'})).toBeVisible();

        // Datos de Origen

        // Cuenta de Origen
        await expect(page.getByText('AHORROS NORMALES')).toBeVisible();

        // Nombre y apellido
        await expect(page.getByText(`${nombre} ${apellido}`).first()).toBeVisible();

        // Cedula
        await expect(page.getByText(`${cedula}`).first()).toBeVisible();

        // Datos de Destino

        // Cuenta de Destino
        await expect(page.getByText('APORTACIONES PREFERENTES')).toBeVisible();

        // Nombre y apellido
        await expect(page.getByText(`${nombre} ${apellido}`).last()).toBeVisible();

        // Cedula
        await expect(page.getByText(`${cedula}`).last()).toBeVisible();

        // Monto
        await expect(page.locator('text=RD$ 2,000')).toBeVisible();

        // Comentario
        await expect(page.getByText('TRANSFERENCIA A LA CUETA DE APORTACIONES PREFERENTES')).toBeVisible();
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
        await page.locator('[aria-label="close"]').click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerra la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})