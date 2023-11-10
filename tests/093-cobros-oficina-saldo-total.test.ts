import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { selectBuscar, inputDiaPago, formComentario } from './utils/data/inputsButtons';
import { url_base, url_cobros_oficina, url_consulta_movimientos_cuentas } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Variables de los buscadores de movimientos cuentas
let buscadorPersona: Locator;
let buscadorCuenta: Locator;

// Pruebas
test.describe.serial('Pruebas con Cobros de Oficina', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Inputs para buscar las cuentas del socio
        buscadorPersona = page.locator(`${selectBuscar}`);
        buscadorCuenta = page.locator('#rc_select_1');
    });

    test('Ir a la opcion de Cobros de Oficina', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Cobros de Oficina
        await page.getByRole('menuitem', {name: 'Cobros Oficina'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cobros_oficina}`);
    });

    test('Buscar un Prestamo de un Socio', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'COBROS OFICINA'})).toBeVisible();

        // Elegir buscar por RNC o Cedula
        await page.locator('(//INPUT[@type="radio"])[3]').click();

        // No debe dejar buscar por nombre de un socio si esta marcado la cedula
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);

        // Debe aparecer un mensaje de que la cuenta no se encontro
        await expect(page.locator('text=No se han encontrado resultados')).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Debe estar visible el credito de la persona
        await expect(page.getByText('CRÉDITO HIPOTECARIO')).toBeVisible();

        // Hacer un pago al credito
        await page.locator('[aria-label="Expand row"]').click();

        // Click al boton de Pagos
        const botonPagos = page.getByText('PAGOS');
        await expect(botonPagos).toBeVisible();
        await botonPagos.click();

        // Se debe abrir un modal
        await expect(page.locator('h1').filter({hasText: 'PAGO A PRÉSTAMO'})).toBeVisible();
    });

    test('Datos Generales del Prestamo', async () => {
        // Titulo de datos generales
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Nombre de la persona
        await expect(page.locator('#form_NOMBREPERSONA')).toHaveValue(`${nombre} ${apellido}`);

        // Prestamo
        await expect(page.locator('#form_DESCOFERTA')).toHaveValue('CRÉDITO HIPOTECARIO');

        // Cuota
        await expect(page.locator('#form_MONTOCUOTA')).toHaveValue('RD$ 3,885');

        // Garantia
        await expect(page.getByText('Sin garantía')).toBeVisible();

        // Linea de Credito
        await expect(page.getByText('Línea de Crédito')).toBeVisible();
        await expect(page.getByText('No', {exact: true})).toBeVisible();

        // Dia de Pago
        await expect(page.locator(`${inputDiaPago}`)).toBeDisabled();
    });

    test('Ver la o las cuentas de cobro pertenecientes al prestamo', async () => {
        // Click al boton de Ver cuentas
        const botonVerCobros = page.getByRole('button', {name: 'Cuenta(s) de cobro'});
        await expect(botonVerCobros).toBeVisible();
        await botonVerCobros.click();

        // Debe aparecer un modal con las cuentas de cobro
        const modal = page.locator('h1').filter({hasText: 'CUENTA(S) DE COBRO DEL PRÉSTAMO'});
        await expect(modal).toBeVisible();

        // En el modal debe estar la cuenta de Ahorros Normales de la persona que se le coloco como cuenta de cobro
        await page.getByRole('cell', {name: `${nombre} ${apellido}`}).click();
        await page.getByRole('cell', {name: 'AHORROS NORMALES'}).click();

        // Cerrar el modal
        await page.getByLabel('Close').nth(3).click();

        // El modal debe desaparecer
        await expect(modal).not.toBeVisible();
    });

    test('Historial de Pagos del Prestamo', async () => {
        // Boton hsitorial de pagos
        const botonHistorial = page.getByRole('button', {name: 'Historial de pagos'});
        await expect(botonHistorial).toBeVisible();
        await botonHistorial.click();

        // Debe salir el modal del historial de pagos, por lo que debe estar el boton de imprimir
        const botonImprimirTodos = page.getByRole('button', {name: 'Todos los Recibos'});
        await expect(botonImprimirTodos).toBeVisible();
        await botonImprimirTodos.click();

        // Esperar que se abra una nueva ventana con el reporte de todo el historial de pagos
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close(); 

        // Click en Aceptar para cerrar el modal
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test('Opciones de Pago', async () => {
        // Titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'OPCIONES DE PAGO'})).toBeVisible();

        // Cuotas pendientes
        await expect(page.getByText('0 cuotas pendientes RD 0.00')).toBeVisible();

        // Adelantar cuotas
        await expect(page.getByText('Adelantar cuotas')).toBeVisible();

        // Saldo total
        await expect(page.getByText('Saldo total')).toBeVisible();

        // Click a la opcion de Saldo total
        await page.getByText('Saldo total').click();

        // En el input de total a pagar debe colocarse el saldo total
        await expect(page.locator('#form_A_PAGAR')).toHaveValue('RD$ 150,000');

        // Agregar un comnetario
        await page.locator(`${formComentario}`).fill('Saldar el Prestamo');
    });

    test('Cobrar de Cuenta', async () => {
        // Via de cobro
        await expect(page.locator('text=Vía de cobro')).toBeVisible();

        // Elegir la opcion de cobrar de cuenta
        const cobrarCuenta = page.getByText('Cobrar de cuenta');
        await expect(cobrarCuenta).toBeVisible();
        await page.locator('(//INPUT[@type="radio"])[5]').click();

        // Seleccionar la cuenta de ahorros del socio
        await page.getByRole('dialog', {name: 'Pago a Préstamo'}).locator(`${selectBuscar}`).click();
        await page.getByText('AHORROS NORMALES').click();
    });

    test('Realizar el pago', async () => {
        // Boton Aplicar
        const botonAplicar = page.getByRole('button', {name: 'Aplicar'});
        await expect(botonAplicar).toBeVisible();
        await botonAplicar.click();

        // Esperar que se abran dos ventanas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');

        // Cerrar todas las paginas
        await page2.close();
        await page1.close();
        
        // En la pagina deberia aparecer una alerta de operacion exitosa
        await expect(page.locator('text=Operación exitosa')).toBeVisible();

        // Debe estar en la pagina de Cobros de Oficina
        await expect(page.locator('h1').filter({hasText: 'COBROS OFICINA'})).toBeVisible();
    });

    test('Ir a la opcion de Consulta Movimientos Cuenta', async () => {
        // Click en contraer todo
        await page.getByText('Contraer todo').click();

        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Movimientos Cuenta
        await page.getByRole('menuitem', {name: 'Consulta Movimientos Cuenta'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);
    });

    test('El comentario del pago al prestamo no debe tener undefined', async () => {
        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Aportaciones
        await page.getByRole('option', {name: 'AHORROS NORMALES', exact: true}).click();

        // Buscar un socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('| AHORROS NORMALES |').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('AHORROS NORMALES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Dirgirse a la pagina 2
        await page.getByText('2', {exact: true}).click();

        // Esperar que se cambie de pagina
        await page.waitForTimeout(2000);

        // Debe mostrarse el comentario del pago al prestamo
        await expect(page.getByRole('cell', {name: 'PAGO A PRESTAMO'})).toBeVisible();

        // No deben mostrarse en el comentario del pago al prestamo la palabra undefined
        await expect(page.locator('text=(undefined)')).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});