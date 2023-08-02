import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar, ariaCerrar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con Cobros de Oficina', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem("apellidoPersona"));
    });

    test('Ir a la opcion de Cobros de Oficina', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Cobros de Oficina
        await page.getByRole('menuitem', {name: 'Cobros Oficina'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cobros_oficina/01-3-2-1/`);
    });

    test('Buscar un Prestamo de un Socio', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'COBROS OFICINA'})).toBeVisible();

        // Elegir buscar por RNC o Cedula
        await page.locator('(//INPUT[@type="radio"])[3]').click();

        // No debe dejar buscar por nombre de un socio si esta marcado la cedula
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);

        // Debe aparecer un mensaje de que la cuenta no se encontro
        await expect(page.locator('text=No se ha encontrado la cuenta digitada')).toBeVisible();

        // Cerrar el mensaje
        await page.locator(`${ariaCerrar}`).click();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Debe estar visible el credito de la persona
        await expect(page.getByText('CRÉDITO HIPOTECARIO')).toBeVisible();

        // Hacer un pago al credito
        await page.locator('[aria-label="Expandir fila"]').click();

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

        // Cuenta Cobro
        await expect(page.locator('#form_DESCRIPCION_CUENTA_COBRO')).toHaveValue('AHORROS NORMALES');

        // Cuota
        await expect(page.locator('#form_MONTOCUOTA')).toHaveValue('RD$ 416.67');

        // Garantia
        await expect(page.getByText('Sin garantía')).toBeVisible();

        // Linea de Credito
        await expect(page.getByText('Línea de Crédito')).toBeVisible();
        await expect(page.getByText('No', {exact: true})).toBeVisible();
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

        // Agregar un comnetario
        await page.locator('#form_COMENTARIO').fill('Saldar el Prestamo');
    });

    test('Cobrar de Cuenta', async () => {
        // Via de cobro
        await expect(page.locator('text=Vía de cobro')).toBeVisible();

        // Elegir la opcion de cobrar de cuenta
        await expect(page.getByText('Cobrar de cuenta')).toBeVisible();
        await page.locator('(//INPUT[@type="radio"])[2]').click();

        // Seleccionar la cuenta de ahorros del socio
        await page.getByRole('dialog', {name: 'Pago a Préstamo'}).locator(`${selectBuscar}`).click();
        await page.getByText('AHORROS NORMALES').click();

        // Debe mostrarse el monto disponible de la cuenta
        await expect(page.locator('Disponible')).toBeVisible();
    });

    test('Realizar el pago', async () => {
        // Boton Aplicar
        const botonAplicar = page.getByRole('button', {name: 'Aplicar'});
        // Esperar que se abran dos ventanas con los reportes
        const [newPage, newPage2] = await Promise.all([
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAplicar).toBeVisible(),
            await botonAplicar.click()
        ]);

        // Cerrar la primera pagina 
        await newPage.close();

        // Cerrar la segunda pagina
        await newPage2.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});