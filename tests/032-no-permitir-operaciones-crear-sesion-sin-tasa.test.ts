import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, dataCheck, dataGuardar, formBuscar, dataCerrar } from './utils/dataTests';
import { url_sesiones_transito, url_registro_tasa } from './utils/urls';
import { formatDate } from './utils/fechas';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Creacion de una Sesion de Transito que no debe permitir operaciones sin una tasa registrada', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context 
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ingresar a la pagina de Registro de Tasa Simple', async () => {
        // Configuracion
        await page.getByRole('menuitem', {name: 'CONFIGURACION'}).click();

        // Monedas, Calculos
        await page.getByRole('menuitem', {name: 'MONEDAS, CALCULOS'}).click();

        // Registro tasa simple
        await page.getByRole('menuitem', {name: 'Registro Tasa Simple'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_registro_tasa}`);
    });

    test('Borrar la Tasa del Dia registrada', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('text=Tasas de cambio del día')).toBeVisible();

        // La tasa del dia debe estar visible
        await expect(page.getByRole('cell', {name: '56.0000'}).first()).toBeVisible();

        // Click al boton de Inhabilitar
        const botonInhabilitar = page.getByRole('row', {name: `${formatDate(new Date())} DOLARES (US) 56.0000`}).locator(`${dataCheck}`);
        await expect(botonInhabilitar).toBeVisible();
        await botonInhabilitar.click();

        // Debe aparecer un mensaje modal de confirmacion
        await expect(page.locator('text=¿Está seguro que desea inhabilitar este registro?')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test('Ir a la opcion de Sesiones en Transito', async () => {
        // Click a Contraer todo del menu de navegacion
        await page.locator('text=Contraer todo').click();

        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // OPERACIONES
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Sesiones en Transito
        await page.getByRole('menuitem', {name: 'Sesiones en Tránsito', exact: true}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_sesiones_transito}`); 
    });

    test('Crear una nueva Sesion de Transito', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SESIONES EN TRÁNSITO'})).toBeVisible();
        
        // Click al boton de Crear Sesion
        const botonCrearSesion = page.getByRole('button', {name: 'Crear Sesión'});
        await expect(botonCrearSesion).toBeVisible();
        await botonCrearSesion.click();

        // Aparece el modal para buscar personas
        await expect(page.locator('text=ABRIR NUEVA SESIÓN')).toBeVisible();

        // Buscar una persona
        await page.getByRole('dialog').locator(`${formBuscar}`).fill(`${cedula}`);

        // Aparecen las cuentas de la persona, elegir la cuenta de Ahorros Normales
        await page.getByRole('row', {name: 'AHORROS NORMALES'}).locator('text=Seleccionar').click();

        // Cerrar el modal de Abrir Nueva Sesion
        await page.locator(`${dataCerrar}`).click();

        // Seleccionar la sesion ya creada
        const botonSeleccionarSesion = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'Seleccionar'});
        await expect(botonSeleccionarSesion).toBeVisible();
        await botonSeleccionarSesion.click();

        // Se dirige a la opcion de Transacciones de Caja
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2`);

        // Debe aparecer el mensaje de aviso
        await expect(page.locator('text=Es necesario registrar la tasa del día. Imposible realizar operaciones.')).toBeVisible();

        // Click al boton de Aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click(); 

        // Se deben mostrar los botones de Deposito y Retiro, los cuales deben estar deshabilitados
        await expect(page.getByRole('button', {name: 'DEPOSITO'})).toBeDisabled();  
        await expect(page.getByRole('button', {name: 'RETIRO'})).toBeDisabled();
    });

    test('Liberar la Sesion', async () => {
        // Click al boton de Liberar Sesion
        const botonLiberarSesion = page.getByRole('button', {name: 'Liberar Sesión'});
        await expect(botonLiberarSesion).toBeVisible();
        await botonLiberarSesion.click();

        // Debe salir un mensaje de Confirmacion
        await expect(page.locator('text=¿Está seguro que desea proceder con esta acción?')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe salir un mensaje de Operacion Exitosa
        await expect(page.locator('text=Sesiones en transito actualizada exitosamente.')).toBeVisible();
    });

    test('Ir nuevamente a la opcion de Registro de Tasa Simple', async () => {
        // Click a Contraer todo del menu de navegacion
        await page.locator('text=Contraer todo').click();

        // Configuracion
        await page.getByRole('menuitem', {name: 'CONFIGURACION'}).click();

        // Monedas, Calculos
        await page.getByRole('menuitem', {name: 'MONEDAS, CALCULOS'}).click();

        // Registro tasa simple
        await page.getByRole('menuitem', {name: 'Registro Tasa Simple'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_registro_tasa}`);
    })

    test('Agregar nuevamente la Tasa del Dia', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('text=Tasas de cambio del día')).toBeVisible();

        // Click al boton de Agregar
        await page.getByRole('button', {name: 'Agregar'}).click();
        
        // Click input[role="spinbutton"]
        await page.locator('input[role="spinbutton"]').click();

        // Fill input[role="spinbutton"]
        await page.locator('input[role="spinbutton"]').fill('56');

        // Click en guardar tasa
        await page.locator(`${dataGuardar}`).click();

        // Debe aparecer un mensaje preguntando si se guardara la tasa o no
        const mensajeConfirmacion = page.locator('text=¿Deseas guardar la operación?');
        await expect(mensajeConfirmacion).toBeVisible();

        // Boton de Cancelar
        await expect(page.getByRole('button', {name: 'Cancelar'})).toBeVisible();

        // Click button:has-text("Aceptar")
        await page.locator('button:has-text("Aceptar")').click();

        // El mensaje de confirmacion no debe estar visible
        await expect(mensajeConfirmacion).not.toBeVisible();

        // Debe aparecer una alerta de operacion exitosa
        await expect(page.locator('text=Moneda historial almacenado exitosamente.')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
