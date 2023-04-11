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
            headless: false,
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
        const cedula = page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ESTADO DE CUENTA DEL CLIENTE'})).toBeVisible();

        // Buscar un socio
        await page.locator('#form').getByRole('combobox').fill(`${cedula}`);
        // Click al spcio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();
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
        const estadoCancelado = page.locator('text=CUENTAS Y PRÉSTAMOS CANCELADOS');
        await estadoCancelado.click();

        // No deben haber datos
        await expect(page.locator('text=No hay datos').first()).toBeVisible();

        // Cambiar el estado de los productos a todos
        await page.locator('#root').getByTitle('Cuentas y préstamos CANCELADOS').click();
        await page.getByRole('option', {name: 'Todos'}).click(); 
    });

    test('Deben estar todas los productos que se han realizado anteriormente', async () => {
        // Cuenta de Aportaciones
        await expect(page.getByRole('row', {name: 'APORTACIONES'})).toBeVisible();

        // Cuenta de Ahorros
        await expect(page.getByRole('row', {name: 'AHORROS NORMALES'})).toBeVisible();

        // Cuenta de Certificados - Financieros Pagaderas
        await expect(page.getByRole('row', {name: 'FINANCIEROS PAGADERAS'})).toBeVisible();

        // Cuenta de Aportaciones Preferentes
        await expect(page.getByRole('row', {name: 'APORTACIONES PREFERENTES'})).toBeVisible();

        // Credito Hipotecario
        await expect(page.locator('text=CRÉDITO HIPOTECARIO')).toBeVisible();
    });

    test('No se deben mostrar los creditos aprobados', async () => {
        // No deben estar los creditos aprobados
        await expect(page.locator('text=APROBADO')).not.toBeVisible();
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
        await expect(newPage.locator('text=APORTACIONES').first()).toBeVisible();

        // Tiene que estar el deposito a la cuenta, mediante el comentario
        await expect(newPage.locator('text=DEPOSITO DE 1000 PESOS A LA CUENTA DE APORTACIONES')).toBeVisible();

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

        // Tiene que estar el deposito a la cuenta, mediante el comentario
        await expect(newPage.locator('text=DEPOSITO DE 1000 PESOS A LA CUENTA DE AHORROS')).toBeVisible();

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
        await expect(newPage.locator('text=FINANCIEROS PAGADERAS').first()).toBeVisible();

        // Tiene que estar la transaccion de la cuenta, de 50 pesos
        await expect(newPage.locator('text=50.00').first()).toBeVisible();

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
        await expect(page.getByText('Presione ACEPTAR para generar el reporte')).toBeVisible();

        // Boton Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
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

        // Fecha de Corte
        const fechaCorte = page.locator('#form_rp_fecha');
        await expect(fechaCorte).toBeVisible();

        // Ingresar la fecha actual
        await fechaCorte.fill(`${formatDate(new Date())}`);

        // Boton Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
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

    test('Imprimir Reporte Estado de Cuentas', async () => {
        // Click para elegir un reporte
        await page.locator('#form_REPORTE').click();
        // Elegir un reporte
        await page.getByRole('option', {name: 'ESTADO DE CUENTAS'}).click();

        // Fecha Inicial
        const fechaInicial = page.locator('#form_rp_fecha_inicio');
        await expect(fechaInicial).toBeVisible();

        // Restarle un dia a la fecha actual
        const dia = new Date();
        dia.setDate(dia.getDate() - 1);
        /* setDate = cambiar el dia del mes. getDate = Devuelve un numero del mes entre 1 y 31 
        A la fecha actual se cambia el dia del mes por el dia devuelto por getDate menos 1 */
        const diaAnterior = formatDate(dia);

        // Ingresar la fecha Inicial
        await fechaInicial.fill(`${diaAnterior}`);

        // Fecha Final 
        const fechaFinal = page.locator('#form_rp_fecha_final');
        await expect(fechaFinal).toBeVisible();

        // Ingresar la fecha Final
        await fechaFinal.fill(`${formatDate(new Date())}`);

        // Boton Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]); 

        // Cerrar la pagina con los movimientos de la cuenta
        await newPage.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})