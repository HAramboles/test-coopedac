import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import {  selectBuscar, inputDiaPago, formBuscar } from './utils/data/inputsButtons';
import { url_base, url_cobros_oficina, url_sesiones_transito } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { nombreTestigoCajero, userCorrecto } from './utils/data/usuarios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Modal
let modalPagoPrestamo: Locator;

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
        apellido = await page.evaluate(() => window.localStorage.getItem("apellidoPersona"));

        // Modal para realizar el pago al prestamo
        modalPagoPrestamo = page.locator('h1').filter({hasText: 'PAGO A PRÉSTAMO'});
    });

    // Funcion para cerrar las paginas con los reportes
    const CerrarPaginasReportes = async () => {
        context.on('page', async (page) => {
            await page.waitForTimeout(1000);
            await page.close();
        });
    };

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

        // Borrar el nombre digitado
        await page.waitForTimeout(1000);
        await page.locator(`${selectBuscar}`).clear();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Debe estar visible la tabla de los prestamos del socio
        await expect(page.getByRole('columnheader', {name: 'Producto', exact: true})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'No. Producto'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Desembolsado'})).toBeVisible();

        // Debe estar visible el credito de la persona
        await expect(page.getByText('CRÉDIAUTOS')).toBeVisible();
        await expect(page.getByText('125,000.00')).toBeVisible();

        // Hacer un pago al credito
        await page.getByRole('row', {name: 'Expand row CRÉDIAUTOS'}).getByLabel('Expand row').click();

        // Click al boton de Pagos
        const botonPagos = page.getByText('PAGOS');
        await expect(botonPagos).toBeVisible();
        await botonPagos.click();

        // Se debe abrir un modal
        await expect(modalPagoPrestamo).toBeVisible();
    });

    test('Datos Generales del Prestamo', async () => {
        // Titulo de datos generales
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Nombre de la persona
        await expect(page.locator('#form_NOMBREPERSONA')).toHaveValue(`${nombre} ${apellido}`);

        // Prestamo
        await expect(page.locator('#form_DESCOFERTA')).toHaveValue('CRÉDIAUTOS');

        // Cuota
        await expect(page.locator('#form_MONTOCUOTA')).toHaveValue('RD$ 3,015.9');

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
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();

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
    });

    test('Hacer un Abono a Capital', async () => {
        // Colocar un abono a capital
        const abonoCapital = page.locator('#form_MONTO_ABONO_CAPITAL');
        await expect(abonoCapital).toBeVisible();
        await abonoCapital.fill('12000');

        // El valor de Abono a Capital y Total a Pagar deben ser igual
        await expect(abonoCapital).toHaveValue('RD$ 12,000');
        
        const totalPagar = page.locator('#form_A_PAGAR');
        await expect(totalPagar).toBeDisabled();
        await expect(totalPagar).toHaveValue('RD$ 12,000');
    });

    test('Enviar el pago a una Caja', async () => {
        // Via de cobro
        await expect(page.locator('text=Vía de cobro')).toBeVisible();

        // Elegir la opcion de enviar a caja
        const cobrarCuenta = page.getByText('Enviar a Caja');
        await expect(cobrarCuenta).toBeVisible();
        await page.locator('(//INPUT[@type="radio"])[4]').click();

        // Elegir la caja a la que se le enviara el pago
        await page.getByTitle('TODOS - TODOS').click();
        // Elegir la caja en uso
        await page.getByRole('option', {name: `CAJA ${userCorrecto} - ${nombreTestigoCajero}`}).click();

        // Boton Aplicar
        const botonAplicar = page.getByRole('button', {name: 'Aplicar'});
        await expect(botonAplicar).toBeVisible();
        await botonAplicar.click();

        // El modal debe cerrarse
        await expect(modalPagoPrestamo).not.toBeVisible();

        // Debe aparecer una alerta de operacion exitosa
        await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
    });

    test('Ir a Sesiones en Transito', async () => {
        // Click a contraer todo
        await page.getByText('Contraer todo').click();

        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Sesiones en Transito
        await page.getByRole('menuitem', {name: 'Sesiones en Tránsito', exact: true}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_sesiones_transito}`);
    });

    test('Buscar la Sesion enviada a Caja', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SESIONES EN TRÁNSITO'})).toBeVisible();

        // Click al boton de Actualizar
        const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
        await expect(botonActualizar).toBeVisible();
        await botonActualizar.click();

        // Buscar a la persona
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Esperar que la sesion buscada este visible
        await page.waitForTimeout(2000);

        // Debe mostrarse el area emisora y el nombre del socio de la sesion enviada desde Cobros de Oficina
        const sesionPagoPrestamoCaja = page.getByRole('row', {name: 'COBROS'}).getByRole('cell', {name: `${nombre} ${apellido}`}).first();
        await expect(sesionPagoPrestamoCaja).toBeVisible();
        // Boton de Seleccionar
        const botonSeleccionar = page.getByRole('button', {name: 'Seleccionar'}).first();
        await expect(botonSeleccionar).toBeVisible();
        // Click al boton de Seleccionar
        await botonSeleccionar.click();
    });

    test('Aplicar el pago al prestamo desde Caja', async () => {
        // La URL debe cambiar a la transacciones de caja
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2`);

        // Debe aparecer una alerta de operacion exitosa
        await expect(page.locator('text=Sesiones en transito actualizada exitosamente.')).toBeVisible();

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();

        // Debe mostrarse el nombre de la persona
        await expect(page.getByTitle(`${nombre} ${apellido}`)).toBeVisible();

        // Tabla de los ingresos en transito
        await expect(page.locator('h1').filter({hasText: 'INGRESOS EN TRÁNSITO'})).toBeVisible();

        // Debe aparecer el area emisosa
        await expect(page.getByRole('cell', {name: 'COBROS'})).toBeVisible();

        // Debe aparecer la operacion del pago
        await expect(page.getByRole('cell', {name: 'RECIBO DE PRESTAMOS'})).toBeVisible();

        // Click al boton de Aplicar
        const botonAplicar = page.getByRole('button', {name: 'Aplicar'});
        await expect(botonAplicar).toBeVisible();
        await botonAplicar.click();
    });

    test('Modal de Distribucion de Ingresos', async () => {
        // Debe salir un modal para la distribucion de ingresos
        await expect(page.locator('text=DISTRIBUCIÓN DE INGRESOS')).toBeVisible();

        // El modal debe contener 4 titulos y todos deben estar visibles
        await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();
    });

    test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {
        // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
        const iconoAlerta = page.getByRole('img', {name: 'close-circle'}).first();
        await expect(iconoAlerta).toBeVisible();

        // Hacer la distribucion del dinero a pagar al prestamo, en el caso de la prueba RD 12000
        // Divididos en 100 monedas de 1000 y una de 100
        const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000

        // Cantidad = 12 de 1000
        await cant1000.click();
        await cant1000.fill('12');

        // El icono de la alerta roja ya no debe estar visible al distribuirse correctamente lo recibido
        await expect(iconoAlerta).not.toBeVisible();

        // Hacer click al boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();
    });

    test('Datos para el Reporte RTE', async () => {
        // Debe salir otro modal para colocar la informacion para el reporte RTE
        await expect(page.locator('text=CAPTURA DE DATOS. LAVADO DE EFECTIVO')).toBeVisible();

        // El modal debe contener un aviso
        await expect(page.getByText('Se requiere información de la persona que realiza la transacción. Puede buscar o crear la persona en las opciones de más abajo.')).toBeVisible();

        // Colocar una explicacion para el Origen de Fondos
        await page.locator('#form_ORIGEN_FONDOS').fill('Fondos obtenidos del Trabajo');

        // Subtitulo del modal
        await expect(page.locator('text=BUSCAR INTERMEDIARIO')).toBeVisible();

        // Debe mostrarse un input para buscar un intermediario
        await expect(page.locator(`${formBuscar}`)).toBeVisible();

        // Debe mostrarse un boton para crear un intermediario
        const botonCrearIntermediario = page.getByRole('button', {name: 'Crear Intermediario'});
        await expect(botonCrearIntermediario).toBeVisible();
        await botonCrearIntermediario.click();

        // Debe salir un modal de registro de persona
        await expect(page.locator('text=REGISTRAR INTERMEDIARIO')).toBeVisible();

        // Click al boton de Cancelar del modal de Crear Intermediario
        await page.getByLabel('Registrar Intermediario').getByRole('button', {name: 'stop Cancelar'}).click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click al boton de Aceptar del modal de confirmacion
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Boton de Cliente es Intermediario
        const botonClienteIntermediario = page.getByText('Cliente Intermediario');
        await expect(botonClienteIntermediario).toBeVisible();

        // Click al boton de Cliente Intermediario
        await botonClienteIntermediario.click();

        // Los datos del socio deben agregarse
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Click al boton de Seleccionar
        await page.getByText('Seleccionar').click();

        // Debe salir otro modal para confirmar la informacion
        await expect(page.locator('text=Confirmar')).toBeVisible();

        // Contenido del modal
        await expect(page.locator('text=Asegúrese de haber seleccionado a la persona correcta:')).toBeVisible();
        await expect(page.getByText(`Nombre: ${nombre} ${apellido}`)).toBeVisible();
        await expect(page.getByText('Doc. Identidad:')).toBeVisible();

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();

        // Debe regresar a la pagina
        await expect(page.locator('h1').filter({hasText: 'COBROS OFICINA'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});