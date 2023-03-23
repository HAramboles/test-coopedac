import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';
import { formatDate } from './utils/utils';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Prueba con el Estado de Cuenta', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: true,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear una nueva Page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la seccion de Estado de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas    
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Estado de Cuentas    
        await page.getByRole('menuitem', {name: 'Estado de Cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/estado_cuentas/01-2-4-2/`);
    });

    test('Buscar un socio', async () => {
        // Cedula, nombre y apellido de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Buscar un socio
        await page.locator('#select-search').fill(`${cedula}`);
        // Click al spcio buscado
        await page.locator(`text=${cedula}`).click();

        // El nombre y el apellido de la persona debe estar visible
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();
    });

    test('Cambiar los Estados de los productos', async () => {
        // El titulo de los productos del socio debe estar visible
        await expect(page.locator('h1').filter({hasText: 'PRODUCTOS DEL SOCIO'})).toBeVisible();

        // Estado de los productos
        const estadoDesembolsado = page.locator('text=CUENTAS ACTIVAS Y PRÉSTAMOS DESEMBOLSADOS');
        await expect(estadoDesembolsado).toBeVisible();
        // Click para cambiar de estado
        await estadoDesembolsado.click();
        // Cambiar a cuentas y prestamos cancelados
        const estaodCancelado = page.locator('text=CUENTAS Y PRÉSTAMOS CANCELADOS');
        await estaodCancelado.click();

        // No deben haber datos
        await expect(page.locator('text=No hay datos')).toBeVisible();

        // Cambiar el estado de los productos a todos
        await estaodCancelado.click();
        await page.locator('text=Todos').click(); 
    });

    test('Deben estar todas los productos que se han realizado anteriormente', async () => {
        // Cuenta de Aportaciones
        await expect(page.locator('text=APORTACIONES')).toBeVisible();

        // Cuenta de Ahorros
        await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();

        // Cuenta de Certificados - Financieros Pagaderas
        await expect(page.locator('FINANCIEROS PAGADERAS')).toBeVisible();

        // Cuenta de Aportaciones Preferentes
        await expect(page.locator('text=APORTACIONES PREFERENTES')).toBeVisible();

        // Credito Hipotecario
        await expect(page.locator('text=CRÉDITO HIPOTECARIO')).toBeVisible();
    });

    test('Ver los movimientos de la cuenta de Aportaciones', async () => {
        // Boton de ver movimientos
        const verMovimientos = page.getByRole('row', {name: 'APORTACIONES'}).locator('[data-icon="export"]');
        // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(verMovimientos).toBeVisible(),
            await verMovimientos.click()
        ]);

        // La URL de la pagina debe contene que es una consulta de una cuenta
        await expect(newPage).toHaveURL(/\/consulta_captaciones/);

        // El titulo de movimienos de cuenta debe estar visible
        await expect(newPage.locator('h1').filter({hasText: 'MOVIMIENTOS DE CUENTAS'})).toBeVisible();

        // Los movimientos deben ser de la cuenta de aportaciones
        await expect(newPage.locator('APORTACIONES').first()).toBeVisible();

        // Tiene que estar el deposito a la cuenta, mediante el comentario
        await expect(page.locator('text=DEPOSITO DE 1000 PESOS A LA CUENTA DE APORTACIONES')).toBeVisible();

        // Cerrar la pagina
        await newPage.close();
    });

    test('Ver los movimientos de la cuenta de Ahorros Normales', async () => {
        // Boton de ver movimientos
        const verMovimientos = page.getByRole('row', {name: 'AHORROS NORMALES'}).locator('[data-icon="export"]');
        // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(verMovimientos).toBeVisible(),
            await verMovimientos.click()
        ]);

        // La URL de la pagina debe contene que es una consulta de una cuenta
        await expect(newPage).toHaveURL(/\/consulta_captaciones/);

        // El titulo de movimienos de cuenta debe estar visible
        await expect(newPage.locator('h1').filter({hasText: 'MOVIMIENTOS DE CUENTAS'})).toBeVisible();

        // Los movimientos deben ser de la cuenta de aportaciones
        await expect(newPage.locator('AHORROS NORMALES').first()).toBeVisible();

        // Tiene que estar el deposito a la cuenta, mediante el comentario
        await expect(page.locator('text=DEPOSITO DE 1000 PESOS A LA CUENTA DE AHORROS')).toBeVisible();

        // Cerrar la pagina
        await newPage.close();
    });

    test('Ver los movimientos de la cuenta de Certificados - Financieros Pagaderas', async () => {
        // Boton de ver movimientos
        const verMovimientos = page.getByRole('row', {name: 'FINANCIEROS PAGADERAS'}).locator('[data-icon="export"]');
        // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(verMovimientos).toBeVisible(),
            await verMovimientos.click()
        ]);

        // La URL de la pagina debe contene que es una consulta de una cuenta
        await expect(newPage).toHaveURL(/\/consulta_captaciones/);

        // El titulo de movimienos de cuenta debe estar visible
        await expect(newPage.locator('h1').filter({hasText: 'MOVIMIENTOS DE CUENTAS'})).toBeVisible();

        // Los movimientos deben ser de la cuenta de aportaciones
        await expect(newPage.locator('FINANCIEROS PAGADERAS').first()).toBeVisible();

        // Tiene que estar la transaccion de la cuenta, de 50 pesos
        await expect(page.locator('text=50.00').first()).toBeVisible();

        // Cerrar la pagina
        await newPage.close();
    });

    test('Ver los movimientos de la cuenta de Aportaciones Preferentes', async () => {
        // Boton de ver movimientos
        const verMovimientos = page.getByRole('row', {name: 'APORTACIONES PREFERENTES'}).locator('[data-icon="export"]');
        // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(verMovimientos).toBeVisible(),
            await verMovimientos.click()
        ]);

        // La URL de la pagina debe contene que es una consulta de una cuenta
        await expect(newPage).toHaveURL(/\/consulta_captaciones/);

        // El titulo de movimienos de cuenta debe estar visible
        await expect(newPage.locator('h1').filter({hasText: 'MOVIMIENTOS DE CUENTAS'})).toBeVisible();

        // Los movimientos deben ser de la cuenta de aportaciones
        await expect(newPage.locator('APORTACIONES PREFERENTES').first()).toBeVisible();

        // Cerrar la pagina
        await newPage.close();
    });

    test('Imprimir Reporte Estado Cuenta Prestamos', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Se debe abrir un modal
        await expect(page.locator('text=Seleccione un reporte')).toBeVisible();

        // Click para elegir un reporte
        await page.locator('#form_REPORTE').click();
        // Elegir un reporte
        await page.locator('text=ESTADO CUENTA PRESTAMOS').click();

        // Debe mostrar un mensaje 
        await expect(page.locator('text=Precione ACEPTAR para generar el reporte')).toBeVisible();

        // Boton Aceptar
        const botonAceptar = page.locator('text=Aceptar');
        // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]); 

        // Cerrar la pagina
        await newPage.close();
    });

    test('Imprimir Reporte Estado del Cliente', async () => {
        // Click para elegir un reporte
        await page.locator('#form_REPORTE').click();
        // Elegir un reporte
        await page.locator('text=ESTADO DEL CLIENTE').click();

        // Debe mostrar un mensaje 
        const fechaCorte = page.locator('#form_rp_fecha');
        await expect(fechaCorte).toBeVisible();

        // Ingresar la fecha actual
        await fechaCorte.fill(`${formatDate(new Date())}`);

        // Boton Aceptar
        const botonAceptar = page.locator('text=Aceptar');
        // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]); 

        // Cerrar la pagina
        await newPage.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})