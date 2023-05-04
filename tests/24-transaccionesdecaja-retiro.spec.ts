import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Nota de la cuenta de aportaciones de la persona
let nota: string | null;

// Nombre y apellido del co-propietario
let nombreCopropietario: string | null;
let apellidoCopropietario: string | null;

// Pruebas

test.describe('Pruebas con Transacciones de Caja - Retiro', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona alamcenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Nota alamacenada en el state
        nota = await page.evaluate(() => window.localStorage.getItem('nota'));

        // Nombre y apellido del co-propietario
        nombreCopropietario = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellidoCopropietario = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
    });

    test('Ir a la opcion de Transacciones de Caja', async () => {
        // Tesoreria
        await page.locator('text=TESORERIA').click();

        // Cajas
        await page.locator('text=CAJAS').click();

        // Operaciones 
        await page.locator('text=OPERACIONES').click();
        
        // Transacciones de Caja
        await page.locator('text=Transacciones de Caja').click();

        // La URL debe cambiar  
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2/`);
    });

    test('Transacciones de Caja - Retiro', async () => {        
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();

        // Titulo Captaciones
        await expect(page.locator('h1').filter({hasText: 'CAPTACIONES'})).toBeVisible();

        // Titulo Colocaciones  
        await expect(page.locator('h1').filter({hasText: 'COLOCACIONES'})).toBeVisible();

        // Ingresos en Transito
        await expect(page.locator('h1').filter({hasText: 'INGRESOS EN TRÁNSITO'})).toBeVisible();

        // Egresos en Transito
        await expect(page.locator('h1').filter({hasText: 'EGRESOS EN TRÁNSITO'})).toBeVisible(); 
    });
    
    test('Seleccionar un socio', async () => {
        // Input para buscar el socio
        const buscarSocio = page.locator('#select-search');
        await expect(buscarSocio).toBeVisible();

        // Ingresar la cedula del socio
        await buscarSocio.fill(`${cedula}`);
        // Seleccionar la cuenta de ahorros normales del socio
        await page.locator('text=AHORROS NORMALES').click();
    });

    test('Debe salir un modal con la nota anteriormente creada', async () => {
        // Titulo del modal
        await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();

        // La nota debe estar visible
        await expect(page.getByRole('cell', {name: `${nota}`})).toBeVisible();

        // La nota debe estar como completada
        //await expect(page.locator('.ant-space > div:nth-child(3) > div')).toBeVisible();

        // Cerrar el modal
        await page.locator('[aria-label="close"]').click();  
    });

    test('Boton de Retiro', async () => {
        // Boton de Retiro debe estar visible
        const botonRetiro = page.locator('text=RETIRO');
        await expect(botonRetiro).toBeVisible();
        // Click al boton
        await botonRetiro.click();

        // Debe aparecer un modal con las opciones paar el retiro
        await expect(page.locator('text=RETIRO CUENTAS DE AHORROS')).toBeVisible();
    });

    test('Datos del Retiro de la Cuenta de Ahorro', async () => {
        // Se deben mostrar el titular y el co-propietario
        await expect(page.locator('text=FIRMANTES')).toBeVisible();
        await expect(page.locator('text=CO-PROPIETARIO')).toBeVisible();
        await expect(page.getByRole('cell', {name: 'TITULAR'})).toBeVisible();
        
        // El titulo de las firmas debe estar visible
        await expect(page.getByRole('heading', {name: 'Firmas Autorizadas'})).toBeVisible();

        // La firma del titular debe estar visible
        await expect(page.getByTitle(`${nombre} ${apellido}`).nth(1)).toBeVisible();
        
        // Click en siguiente
        await page.getByRole('button', {name: 'Siguiente'}).click();

        // La firma del co-propietario debe estar visible
        await expect(page.getByTitle(`${nombreCopropietario} ${apellidoCopropietario}`).first()).toBeVisible();

        // Input del monto
        const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
        await expect(campoMonto).toBeVisible();
        await campoMonto.fill('100');

        // Agregar un comentario
        await page.locator('#form_COMENTARIO').fill('Retiro de 100 pesos a la cuenta de Ahorros');

        // Boton Agregar
        await page.locator('text=Agregar').click();

        // Debe salir un mensaje de que la operacion salio correctamente
        await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();

        // Aplicar el retiro
        await page.locator('text=Aplicar').click();
    });

    test('Datos de la Distribucion de Egresos', async () => {
        // Debe salir un modal para la distribucion de egresos
        await expect(page.locator('text=DISTRIBUCIÓN DE EGRESOS')).toBeVisible();

        // El modal debe contener 4 titulos y todos deben estar visibles
        await expect(page.locator('h1').filter({hasText: 'MIS DENOMINACIONES'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();

        // Hacer la distribucion del dinero a retirar, en el caso de la prueba RD 100
        // Divididos en 50 y 50
        const cant50 = page.locator('[id="17"]');

        // Cantidad = 2 de 50
        await cant50.click();
        await cant50.fill('2');

        // Luego de distribuir la cantidad, debe aparecer una opcion de Guardar Entregado
        await expect(page.locator('text=Guardar Entregado')).toBeVisible();

        // Hace click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});

        // Se abrira una nueva pagina con el reporte del retiro
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
        
        // La pagina abierta con el reporte del retiro se debe cerrar
        await newPage.close();
    });

    test('Actualizar la libreta luego de realizar el retiro', async () => {
        // Luego de que se cierre la nueva pestaña, se debe regresar a la pagina anterior
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2/`);

        // Debe aparecer un modal con el mensaje de actualizar la libreta
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

        // El titulo de actualzar libreta debe estar visible
        await expect(newPage.locator('h1').filter({hasText: 'ACTUALIZAR LIBRETA'})).toBeVisible();

        // El boton de imprimir debe estar visible
        await expect(newPage.getByRole('button', {name: 'printer Imprimir'})).toBeVisible();

        // Titulo de Vista Previa
        await expect(newPage.locator('text=VISTA PREVIA')).toBeVisible();

        // La pagina abierta con la vista previa de la libreta se debe cerrar
        await newPage.close();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la pagina
        await page.close();

        // Cerrar el context
        await context.close();
    });
})
