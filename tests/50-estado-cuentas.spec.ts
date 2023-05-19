import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';
import { formatDate } from './utils/utils';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
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
        await expect(page.getByRole('cell', {name: 'APORTACIONES', exact: true}).first()).toBeVisible();

        // Cuenta de Aportaciones Preferentes
        await expect(page.getByRole('cell', {name: 'APORTACIONES PREFERENTES', exact: true})).toBeVisible();

        // Cuenta de Ahorros Normales
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES', exact: true}).first()).toBeVisible();

        // Cuenta de Ahorros Por Nomina
        await expect(page.getByRole('cell', {name: 'AHORROS POR NOMINA', exact: true})).toBeVisible();

        // Cuenta de Aportaciones Preferentes - Orden de pago
        await expect(page.getByRole('cell', {name: 'ORDEN DE PAGO', exact: true})).toBeVisible();

        // Cuenta de Certificados - Financieros Pagaderas
        await expect(page.getByRole('cell', {name: 'FINANCIEROS PAGADERAS', exact: true})).toBeVisible();

        // Credito Hipotecario
        await expect(page.getByRole('cell', {name: 'CRÉDITO HIPOTECARIO', exact: true})).toBeVisible();
    });

    test('No se deben mostrar los creditos aprobados', async () => {
        // No deben estar los creditos aprobados
        await expect(page.locator('text=APROBADO')).not.toBeVisible();
    });

    test('Cambiar los tipos de cuenta que se muestran', async () => {
        // Tipo Cuenta
        await page.getByText('TODAS').click();
        // Elegir el tipo de cuenta de Aportaciones
        await page.getByRole('option', {name: 'APORTACIONES', exact: true}).click();
    });

    test('Ver los movimientos de la cuenta de Aportaciones', async () => {
        test.slow();

        // Boton de ver movimientos
        const verMovimientos = page.getByRole('row', {name: 'APORTACIONES'}).locator('[data-icon="export"]').first();
        await expect(verMovimientos).toBeVisible();
        
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
        await expect(newPage.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Los movimientos deben ser de la cuenta de aportaciones
        await expect(newPage.locator('text=APORTACIONES').first()).toBeVisible();

        // Tiene que estar el deposito a la cuenta, mediante el comentario
        await expect(newPage.locator('text=DEPOSITO DE 2000 PESOS A LA CUENTA DE APORTACIONES')).toBeVisible();

        // Tiene que estar la tarnsferencia entre cuentas hechas anteriormente
        await expect(newPage.locator('text=TRANSFERENCIA A LA CUENTA DE APORTACIONES')).toBeVisible();

        // Cerrar la pagina
        await newPage.close(); 
    });

    test('Cambiar el tipo de cuenta que se muestra de Aportaciones a Todas', async () => {
        // Tipo Cuenta
        await page.locator('#root').getByTitle('APORTACIONES').click();
        
        // Tipo de cuenta a Todas
        await page.getByText('TODAS').click();
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
        await expect(newPage.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Tienen que estar los dos movimientos realizados
        await expect(newPage.locator('text=DEPOSITO INICIAL APERTURA CERTIFICADO APORTACIONES PREFERENTES')).toBeVisible();
        await expect(newPage.locator('text=TRANSFERENCIA A LA CUENTA DE APORTACIONES PREFERENTES (FINANZAS)')).toBeVisible();

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
        await expect(newPage.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Tienen que estar los movimientos de la cuenta
        await expect(newPage.locator('text=DEPOSITO DE 2000 PESOS A LA CUENTA DE AHORROS')).toBeVisible();
        await expect(newPage.locator('text=RETIRO DE 100 PESOS DE LA CUENTA DE AHORROS')).toBeVisible();
        await expect(newPage.locator('text=TRANSFERENCIA BANCARIA')).toBeVisible();
        await expect(newPage.locator('text=RETIRO PARA APERTURA CERTIFICADO FINANCIEROS PAGADERAS')).toBeVisible();
        await expect(newPage.locator('text=RETIRO PARA APERTURA CERTIFICADO APORTACIONES PREFERENTES')).toBeVisible();
        await expect(newPage.locator('text=GENERADO AUTOMATICAMENTE PARA APLICAR DESEMBOLSO PRESTAMO')).toBeVisible();
        await expect(newPage.getByRole('cell', {name: 'TRANSFERENCIA A LA CUENTA DE APORTACIONES', exact: true})).toBeVisible();
        await expect(newPage.locator('text=TRANSFERENCIA A LA CUENTA DE APORTACIONES PREFERENTES (FINANZAS)')).toBeVisible();

        // Cerrar la pagina
        await newPage.close();
    });

    test('Ver los movimientos de la cuenta de Ahorros Por Nomina', async () => {
        // Boton de ver movimientos
        const verMovimientos = page.getByRole('row', {name: 'AHORROS POR NOMINA'}).locator('[data-icon="export"]');
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
        await expect(newPage.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // No tiene que tener ningun movimiento
        await expect(page.getByText('No hay datos')).toBeVisible();

        // Cerrar la pagina
        await newPage.close();
    });

    test('Ver los movimientos de la cuenta de Ahorros - Orden de Pago', async () => {
        // Boton de ver movimientos
        const verMovimientos = page.getByRole('row', {name: 'ORDEN DE PAGO'}).locator('[data-icon="export"]');
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
        await expect(newPage.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // No tiene que tener ningun movimiento
        await expect(page.getByText('No hay datos')).toBeVisible();

        // Cerrar la pagina
        await newPage.close();
    });

    test('Ver los movimientos de la cuenta de Certificados - Financieros Pagaderas', async () => {
        test.slow();

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
        await expect(newPage.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();

        // Los movimientos deben ser de la cuenta de aportaciones
        await expect(newPage.locator('text=FINANCIEROS PAGADERAS').first()).toBeVisible();

        // Tienen que estar los tres movimientos realizados
        await expect(newPage.getByRole('cell', {name: 'DEPOSITO INICIAL APERTURA CERTIFICADO FINANCIEROS PAGADERAS'})).toBeVisible();
        await expect(newPage.getByRole('cell', {name: 'INGRESO DE 2050 PESOS A LA CUENTA DE CERTIFICADO'})).toBeVisible();
        await expect(newPage.getByRole('cell', {name: 'DEBITO DE 600 PESOS A LA CUENTA DE CERTIFICADO'})).toBeVisible();

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