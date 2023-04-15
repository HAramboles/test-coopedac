import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

/* URL de la pagina */
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas en el modo solo lectura, para ver una cuenta', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser, con la propiedad headless
        browser = await chromium.launch({
            headless: false,
        });
        
        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la URL de la pagina
        await page.goto(`${url_base}`);
    });

    // Funcion con el boton de siguiente, que se repite en cada seccion del registro
    const Siguiente = async () => {
        // continuar
        const botonSiguiente = page.locator('button:has-text("Siguiente")');
        // presionar el boton
        await botonSiguiente.click();
    };

    test('Ir a la opcion de Cuentas de Ahorros', async () => {
        // Captaciones
        await page.locator('text=CAPTACIONES').click();
        
        // Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Ahorros
        await page.getByRole('menuitem', {name: 'Ahorros'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros`);
    });

    test('Seleccionar un tipo de captaciones', async () => {
        // El titulo de tipo de captaciones debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();

        // Boton de seleccionar captaciones
        const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
        await expect(botonCaptaciones).toBeVisible();
        // Click al boton
        await botonCaptaciones.click();

        // Constante con la opcion de ahorros normales
        const tipoAhorros = page.locator('text=AHORROS NORMALES');

        if (await tipoAhorros.isHidden()) {
            // Recargar la pagina
            await page.reload();
            // Seleccionar el tipo de captacion Ahorros Normales
            await botonCaptaciones.click();
            await page.locator('text=AHORROS NORMALES').click();
        } else if (await tipoAhorros.isVisible()) {
            // Seleccionar el tipo de captacion Ahorros Normales
            await page.locator('text=AHORROS NORMALES').click();
        }

        // La URL debe de cambiar al elegir el tipo de captacion
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test('Buscar la cuenta de la persona', async () => {
        // Cedula, nombres y apellidos almacenados en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Buscar al socio
        await page.locator('#form_search').fill(`${cedula}`);

        // Click al boton de ver cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=1/);
    });

    test('Probar el boton de Salir', async () => {
        // Recargar la pagina
        await page.reload();

        // El titulo debe estar visible luego de recargar la pagina
        await expect(page.locator('h1').filter({hasText: 'CUENTA DE AHORROS'})).toBeVisible();

        // Boton de Cancelar
        const botonSalir = page.locator('button:has-text("Salir")');
        await expect(botonSalir).toBeVisible();
        await botonSalir.click();

        // Modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();
        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // Debe redirigirse al listado de las cuentas de ahorros
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test('Ver cuenta - Datos Generales', async () => {
        // Cedula, nombres y apellidos almacenados en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Buscar al socio a editar
        await page.locator('#form_search').fill(`${cedula}`);

        // Click al boton de editar cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=1/);

        // El titulo de editar cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CUENTA DE AHORROS'})).toBeVisible();

        // Debe de aparecer el nombre de la persona como titulo
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // Descripcion de la cuenta
        const campoDescripcion = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
        await expect(campoDescripcion).toBeVisible();

        // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
        await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();

        // La categoria debe ser Socio Ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // Editar el monto de confirmacion
        const montoConfirmacion = page.getByPlaceholder('MONTO DE CONFIRMACIÓN');
        await expect(montoConfirmacion).toBeVisible();

        // El componente de firma debe estar visible y debe ser unico
        await expect(page.locator('(//div[@class="ant-upload-list-item-container"])')).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();
    });

    test('Ver cuenta - Contacto de Firmante', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=2/);

        // El titulo de firmantes debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // El boton de Agregar Firmante debe estar visible
        await expect(page.locator('text=Agregar Firmante')).toBeVisible();

        // Por lo menos debe estar la firma del titular
        await expect(page.locator('text=TITULAR')).toBeVisible();

        // Debe tener una firma condicional
        await expect(page.locator('text=(O) FIRMA CONDICIONAL')).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();
    });

    test('Ver cuenta - Metodo de Interes', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=3/);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();

        // Boton Finalizar
        const botonFinalizar = page.locator('button:has-text("Finalizar")')
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Debe regresar a la pagina de inicio de las Cuentas de Ahorros
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test.afterAll(async () => { // despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});