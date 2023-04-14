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
          headless: false,
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
        // Cedula de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        // Input para buscar el socio
        const buscarSocio = page.locator('#select-search');
        await expect(buscarSocio).toBeVisible();

        // Ingresar la cedula del socio
        await buscarSocio.fill(`${cedula}`);
        // Seleccionar la cuenta de aportaciones del socio  
        await page.locator('text=APORTACIONES').click();
    });

    test('Debe salir un modal con la nota anteriormente creada', async () => {
        // Nombre y apellido de la persona alamcenada en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Nota alamacenada en el state
        // const nota = await page.evaluate(() => window.localStorage.getItem('nota'));
        
        // Titulo del modal
        await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();

        // La nota debe estar visible
        // await expect(page.locator('div').filter({hasText: `${nota}`})).toBeVisible();

        // La nota debe estar como completada
        // await expect(page.locator('(//svg[@class="bi bi-check2-all"])')).toBeVisible();

        // Cerrar el modal
        await page.locator('[aria-label="close"]').click();
    });

    test('Boton de Deposito de la cuenta de Aportaciones', async () => {
        // Boton de Deposito debe estar visible
        const botonDeposito = page.getByRole('button', {name: 'DEPOSITO'});
        await expect(botonDeposito).toBeVisible();
        // Click al boton 
        await botonDeposito.click();

        // Debe aparecer un modal con las opciones para el deposito
        await expect(page.locator('text=DEPÓSITO A CUENTA APORTACIONES')).toBeVisible();
    });

    test('Datos del Deposito a la Cuenta de Aportaciones', async () => {
        // Input del monto
        const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
        await expect(campoMonto).toBeVisible();
        await campoMonto.fill('2000');

        // Agregar un comentario
        await page.locator('#form_COMENTARIO').fill('Deposito de 2000 pesos a la cuenta de Aportaciones');

        // Boton Agregar
        await page.locator('text=Agregar').click();

        // Debe salir un mensaje de que la operacion salio correctamente
        await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();
    });

    test('Boton de Deposito de la cuenta de Ahorros', async () => {
        // Click a la cuenta de Ahorros del socio 
        await page.getByRole('row', {name: 'AHORROS NORMALES'}).getByRole('button', {name: 'Expandir fila'}).click();

        // Boton de Deposito debe estar visible
        const botonDeposito = page.getByRole('button', {name: 'DEPOSITO'});
        await expect(botonDeposito).toBeVisible();
        // Click al boton 
        await botonDeposito.click();

        // Debe aparecer un modal con las opciones para el deposito
        await expect(page.locator('text=DEPÓSITO A CUENTA AHORROS NORMALES')).toBeVisible();
    });

    test('Datos del Deposito a la Cuenta de Ahorros', async () => {
        // Input del monto
        const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
        await expect(campoMonto).toBeVisible();
        await campoMonto.fill('2000');

        // Agregar un comentario
        await page.locator('#form_COMENTARIO').fill('Deposito de 2000 pesos a la cuenta de Ahorros');

        // Boton Agregar
        await page.locator('text=Agregar').click();

        // Debe salir un mensaje de que la operacion salio correctamente
        await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();
    });

    test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Aportaciones', async () => {
        // Aplicar el deposito de la cuenta de aportaciones
        await page.locator('text=Aplicar').first().click();

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
        await cant500.fill('3');

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

        // Iconos check verdes
        const iconoVerde1 = page.getByRole('img', {name: 'check-circle'}).first();
        const iconoVerde2 = page.getByRole('img', {name: 'check-circle'}).last();

        // Los dos checks verdes deben salir al hacer bien la distribucion
        await expect(iconoVerde1).toBeVisible();
        await expect(iconoVerde2).toBeVisible();

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

        // Debe salir un modal
        await expect(page.locator('text=¿Desea actualizar la libreta?')).toBeVisible();

        // Cancelar para hacer el siguiente deposito
        await page.locator('text=Cancelar').click();
    });

    test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {
        // Aplicar el deposito de la cuenta de ahorros
        await page.locator('text=Aplicar').click();

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

        // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 2000
        // Divididos en 500, 200, 100, 100 y 50, 50
        const cant500 = page.locator('[id="2"]'); // Campo de RD 500
        const cant200 = page.locator('[id="3"]'); // Campo de RD 200
        const cant100 = page.locator('[id="4"]'); // Campo de RD 100
        const cant50 = page.locator('[id="5"]'); // Campo de RD 50

        // Cantidad = 1 de 500
        await cant500.click();
        await cant500.fill('3');

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

    test.afterAll(async () => {
        // Cerrar la pagina
        await page.close();

        /* Cerrar el context */
        await context.close();
    });
});
