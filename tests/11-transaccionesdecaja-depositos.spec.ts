import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

/* URL de la pagina */
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con Transacciones de Caja - Deposito', () => {
    test.beforeAll(async () => {
        /* Crear el browser, con la propiedad headless */
        browser = await chromium.launch({
          headless: true
        });

        /* Crear un context con el storageState donde esta guardado el token de la sesion */
        context = await browser.newContext({
            storageState: 'state.json'
        });

        /* Crear una nueva page usando el context */
        page = await context.newPage();

        /* Ingresar a la pagina */
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Transacciones de Caja', async () => {
        // Tesoreria
        await page.locator('text=TESORERIA').click();

        // Cajas
        await page.locator('text=CAJAS').click();

        // Operaciones
        await page.locator('text=OPERACIONES').click();

        // Transacciones de caja
        await page.locator('text=Transacciones de Caja').click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2/`);
    });

    test('Transacciones de Caja - Depositos', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();

        // Titulo Captaciones
        await expect(page.locator('h1').filter({hasText: 'CAPTACIONES'})).toBeVisible();

        // Titulo Colocaciones 
        await expect(page.locator('h1').filter({hasText: 'COLOCACIONES'})).toBeVisible();

        // Ingresos en Transito
        await expect(page.locator('h1').filter({hasText: 'INGRESOS EN TRÁNSITO'})).toBeVisible();

        // Egresos en transito
        await expect(page.locator('h1').filter({hasText: 'EGRESOS EN TRÁNSITO'})).toBeVisible();      
    });

    test('Seleccionar un socio', async () => {
        // Input para buscar el socio
        const buscarSocio = page.locator('#select-search');
        await expect(buscarSocio).toBeVisible();

        // Cedula de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        // Ingresar la cedula del socio
        await buscarSocio.fill(`${cedula}`);
        // Seleccionar la cuenta de ahorros normales del socio  
        await page.locator('text=AHORROS NORMALES').click();
    });

    test('Boton de Deposito', async () => {
        // Boton de Deposito debe estar visible
        const botonDeposito = page.locator('text=DEPOSITO');
        await expect(botonDeposito).toBeVisible();
        // Click al boton 
        await botonDeposito.click();

        // Debe aparecer un modal con las opciones para el deposito
        await expect(page.locator('text=DEPÓSITO A CUENTA AHORROS NORMALES')).toBeVisible();
    });

    test('Datos del Deposito a la Cuenta de Ahorro', async () => {
        // Input del monto
        const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
        await expect(campoMonto).toBeVisible();
        await campoMonto.fill('1000');

        // Boton Agregar
        await page.locator('text=Agregar').click();

        // Debe salir un mensaje de que la operacion salio correctamente
        await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();

        // Aplicar el deposito o ingreso
        await page.locator('text=Aplicar').click();
    });

    test('Datos de la Distribucion de Ingresos', async () => {
        // Debe salir un modal para la distribucion de ingresos
        await expect(page.locator('text=DISTRIBUCIÓN DE INGRESOS')).toBeVisible();

        // El modal debe contener 4 titulos y todos deben estar visibles
        await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();

        // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
        const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
        await expect(iconoAlerta).toBeVisible();

        // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 1000
        // Divididos en 500, 200, 100, 100 y 50, 50
        const cant500 = page.locator('[id="2"]'); // Campo de RD 500
        const cant200 = page.locator('[id="3"]'); // Campo de RD 200
        const cant100 = page.locator('[id="4"]'); // Campo de RD 100
        const cant50 = page.locator('[id="5"]'); // Campo de RD 50

        // Cantidad = 1 de 500
        await cant500.click();
        await cant500.fill('1');

        // Cantidad = 1 de 200
        await cant200.click();
        await cant200.fill('1');

        // Cantidad = 2 de 100
        await cant100.click();
        await cant100.fill('2');

        // Cantidad = 2 de 50
        await cant50.click();
        await cant50.fill('2');

        // El icono de la alerta roja ya no debe estar visible al distribuirse correctamente lo recibido
        await expect(iconoAlerta).not.toBeVisible();

        // Hacer click al boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});

        // Se abrira una nueva pagina con el reporte del deposito
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
        
        // La pagina abierta con el reporte del deposito se debe cerrar
        await newPage.close();
    });

    test('Actualizar la libreta luego de realizar el deposito', async () => {
        // Luego de que se cierre la nueva pestaña, se debe regresar a la pagina anterior
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2/`);

        // Debe de aparecer un modal con el mensaje de actualizar la libreta
        await expect(page.locator('text=Actualizar libreta')).toBeVisible();

        // Click en Actualizar
        const botonActualizar = page.getByRole('button', {name: 'check Actualizar'});

        // Se abrira una nueva pagina con la vista previa de la actualizacion de la libreta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonActualizar).toBeVisible(),
            await botonActualizar.click()
        ]);

        // El titulo de actualizar libreta debe estar visible
        await expect(newPage.locator('h1').filter({hasText: 'ACTUALIZAR LIBRETA'})).toBeVisible();

        // El boton de imprimir debe estar visible
        await expect(newPage.getByRole('button', {name: 'printer Imprimir'})).toBeVisible();

        // Titulo de vista previa
        await expect(newPage.locator('text=VISTA PREVIA')).toBeVisible();
        
        // La pagina abierta con la vista previa de la libreta se debe cerrar
        await newPage.close();
    });

    test.afterAll(async () => {
        // Cerrar la pagina
        await page.close();

        /* Cerrar el context */
        await context.close();
    });
});
