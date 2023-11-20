import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataBuscar, dataCheck, formBuscar, formComentario, noData, selectBuscar } from './utils/data/inputsButtons';
import { url_base, url_confirmar_cancelacion_cuentas, url_solicitud_cancelacion_cuentas } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { diaActualFormato } from './utils/functions/fechas';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Comentario de la cancelacion
const comentarioCancelacion:string = 'Ya no requiere la cuenta de Ahorros por Nomina';

// Pruebas
test.describe.serial('Pruebas con la Cancelacion de una Cuenta con balance cero', () => {
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
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
    });

    test('Ir a la opcion de Cancelacion de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solicitud Cancelacion
        await page.getByRole('menuitem', {name: 'Solicitud Cancelación'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_cancelacion_cuentas}`);
    });

    test('Cuentas del Socio elegido', async () => {
        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Titulo seleccionar cuentas
        await expect(page.locator('h1').filter({hasText: 'Seleccionar Cuenta(S)'})).toBeVisible();

        // Deben estar las cuentas del socio
        await expect(page.getByText('APORTACIONES')).toBeVisible();
        await expect(page.getByText('AHORROS NORMALES').first()).toBeVisible();
        await expect(page.getByText('AHORROS POR NOMINA')).toBeVisible();
    });

    test('Las cuentas de Certificados NO deben estar visibles', async () => {
        // Certificado Financieros Pagaderas
        await expect(page.getByText('FINANCIEROS PAGADERAS')).not.toBeVisible();

        // Certificado Financieros Reinvertidas
        await expect(page.getByText('FINANCIEROS REINVERTIDAS')).not.toBeVisible();

        // Certificado Inversion Pagaderas
        await expect(page.getByText('INVERSION PAGADERAS')).not.toBeVisible();
    });

    test('Seleccionar una cuenta para Cancelar', async () => {
        // Elegir la cuenta de Ahorros por Nomina
        await page.getByRole('row', {name: 'AHORROS POR NOMINA'}).last().getByLabel('').check();

        // Titulo razon o motivo de cierre
        await expect(page.locator('h1').filter({hasText: 'RAZÓN O MOTIVO DE CIERRE'})).toBeVisible();

        // Razon
        await page.locator('#form_ID_RAZON').fill('Otras');
        // Elegir otras razones
        await page.locator('text=OTRAS RAZONES').click();

        // Comentario
        await page.locator('#form_OBSERVACION').fill(`${comentarioCancelacion}`);

        // Boton Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close(); 

        // Debe regresar a la pagina
        await expect(page).toHaveURL(`${url_solicitud_cancelacion_cuentas}`);

        // Mensaje de Operacion Exitosa
        await expect(page.locator('text=Solicitud de cambios productos almacenado exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.getByRole('dialog').getByRole('button', {name: 'check Aceptar'}).click();
    });

    test('Ir a la opcion de Confirmar la Cancelacion de Cuentas', async () => {
        // Click a Contraer todo
        await page.getByText('Contraer todo').click();

        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Confirmar Cancelacion Cuentas
        await page.getByRole('menuitem', {name: 'Confirmar Cancelación Cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_confirmar_cancelacion_cuentas}`);
    });

    test('Datos de la Solicitud de la Cancelacion', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES PENDIENTES CIERRE DE CUENTAS'})).toBeVisible();

        // Los resultados de la tabla deben estar ordenados de mas recienta a mas antiguo
        await expect(page.getByRole('cell', {name: `${diaActualFormato}`}).first()).toBeVisible();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // Click en buscar
        await page.locator(`${dataBuscar}`).click();

        // Tipo de Captacion
        await expect(page.getByRole('cell', {name: 'AHORROS POR NOMINA', exact: true})).toBeVisible();

        // Comentario
        await expect(page.getByRole('cell', {name: `${comentarioCancelacion}`})).toBeVisible();
    });

    test('Confirmar la Cancelacion de la Cuenta', async () => {
        // Boton de Confirmar
        await page.locator(`${dataCheck}`).click();

        // Debe redirigirse a la pagina de Cancelacion de Cuentas
        await expect(page).toHaveURL(/\/cancelar_cuentas/);

        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CANCELAR CUENTAS'})).toBeVisible();

        // Nombre del socio
        await expect(page.getByText(`| ${nombre} ${apellido} |`)).toBeVisible();

        // El selector forma de pago debe estar deshabilitado
        const formaPago = page.locator('#form_FORMA_PAGO');
        await expect(formaPago).toBeDisabled();

        // Colocar el mouse encima del selector
        await formaPago.hover();

        // El tooltip debe contener porque esta deshabilitado
        await expect(page.getByRole('tooltip', {name: 'Esta cuenta tiene balance cero (0), no es necesaria una forma de pago.'})).toBeVisible();
        
        // Razon de Cancelacion
        await expect(page.getByText('OTRAS RAZONES')).toBeVisible();

        // Comentario
        await page.locator(`${formComentario}`).fill('Confirmar la Cancelacion de la cuenta de Ahorros por Nomina');
    });

    test('Cancelar la Cuenta', async () => {
        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe aparecer un mensaje modal de confirmacion
        const modalConfirmacion = page.getByText('¿Está seguro que desea cancelar la cuenta?');
        await expect(modalConfirmacion).toBeVisible();

        await page.pause();

        // Click al boton de Aceptar del modal
        await page.getByRole('dialog').getByRole('button', {name: 'check Aceptar'}).click();

        // Debe aparecer un mensaje modal de operacion exitosa
        const modalOperacionExitosa = page.locator('text=Cuenta cancelada correctamente.');
        await expect(modalOperacionExitosa).toBeVisible();

        // Esperar a que se cierre el modal
        await page.waitForTimeout(2000);

        // Click al boton de Aceptar del modal de operacion exitosa
        await page.getByRole('dialog').getByRole('button', {name: 'check Aceptar'}).click();

        // Debe redirigirse a la Confirmacion de Cancelacion de Cuentas
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES PENDIENTES CIERRE DE CUENTAS'})).toBeVisible();

        // Buscar la cuenta cancelada
        await page.locator(`${formBuscar}`).fill(`${cedula}`);
        // Click en buscar
        await page.locator('[data-icon="search"]').click();

        // No deberia mostrar resultados
        await expect(page.locator(`${noData}`)).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
