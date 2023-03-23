import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables Globales

let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Pruebas

test.describe('Editar una Cuenta de Ahorros', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: true,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear la page
        page = await context.newPage();

        // Ir a la URL
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Apertura de cuentas -> Ahorros', async () => {
        // Boton de Captaciones
        await page.locator('text=CAPTACIONES').click();

        // Boton de Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Boton de Ahorros
        await page.getByRole('menuitem', {name: 'Ahorros'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros`);

        // El titulo de ahorros debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
    });

    test('Seleccionar un tipo de captaciones', async () => {
        // El titulo de tipo de captaciones debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();

        // Boton de seleccionar captaciones
        const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
        await expect(botonCaptaciones).toBeVisible();
        // Click al boton
        await botonCaptaciones.click();

        // Seleccionar el tipo de captacion Ahorros Normales
        await page.locator('text=AHORROS NORMALES').click();

        // La URL debe de cambiar al elegir el tipo de captacion
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test('Dirigirse al primer paso de la edicion de cuentas de ahorros', async () => {
        // Cedula, nombres y apellidos de la cuenta de la persona a editar
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Buscar al socio a editar
        await page.locator('#form_search').fill(`${cedula}`);

        // Click al boton de editar cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=1/);

        // El titulo de editar cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();
    });

    test('Probar el boton de Cancelar', async () => {
        // Recargar la pagina
        await page.reload();

        // Boton de Cancelar
        const botonCancelar = page.locator('button:has-text("Cancelar")');
        await expect(botonCancelar).toBeVisible();
        await botonCancelar.click();

        // Modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();
        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // Debe redirigirse al listado de las cuentas de ahorros
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });

    test('Editar Cuenta de Ahorros - Datos Generales', async () => {
        // Cedula, nombres y apellidos de la cuenta de la persona a editar
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Buscar al socio a editar
        await page.locator('#form_search').fill(`${cedula}`);

        // Click al boton de editar cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=1/);

        // El titulo de editar cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();

        // Debe de aparecer el nombre de la persona como titulo
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // Editar la descripcion de la cuenta
        const campoDescripcion = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
        await expect(campoDescripcion).toBeVisible();
        await campoDescripcion.clear();
        await campoDescripcion.fill('CUENTA AHORRATIVA');

        // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
        await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();

        // La categoria debe ser Socio Ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // Editar el monto de confirmacion
        const montoConfirmacion = page.getByPlaceholder('MONTO DE CONFIRMACIÓN');
        await expect(montoConfirmacion).toBeVisible();
        await montoConfirmacion.clear();
        await montoConfirmacion.fill('26,000');

        // El componente de firma debe estar visible y debe ser unico
        await expect(page.locator('(//div[@class="ant-upload-list-item-container"])')).toBeVisible();

        // Click al boton de Actualizar
        const botonActualizar = page.locator('button:has-text("Actualizar")');
        await botonActualizar.click();
    });

    test('Editar una Cuenta de Ahorros - Contacto de Firmante o Persona', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=2/);

        // El titulo de firmantes debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // Por lo menos debe estar la firma del titular
        await expect(page.locator('text=TITULAR')).toBeVisible();

        // El boton de Agregar Firmante debe estar visible
        const AgregarFirmante = page.locator('text=Agregar Firmante');
        await expect(AgregarFirmante).toBeVisible();
        
        // Debe estar la firma del co-propietario
        await expect(page.locator('text=CO-PROPIETARIO')).toBeVisible();

        // Click al boton de Continuar
        const botonContinuar = page.locator('button:has-text("Continuar")');
        await expect(botonContinuar).toBeVisible();
        await botonContinuar.click();
    });

    test('Editar una Cuenta de Ahorros - Metodo de Interes', async () => {
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

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});