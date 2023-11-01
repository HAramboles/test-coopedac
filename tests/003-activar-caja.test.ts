import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, ariaCerrar, browserConfig, ariaAgregar, contextConfig, nombreTestigoCajero, userCorrecto, formBuscar } from './utils/dataTests';
import { url_activar_caja } from './utils/urls';
import { diaActualFormato } from './utils/fechas';

/* Variables globales */
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con Activar Caja', async () => {
    test.beforeAll(async () => { // Antes de que se realicen todas las pruebas
        /* Crear el browser, con la propiedad headless */
        browser = await chromium.launch(browserConfig);

        /* Crear un context con el storageState donde esta guardado el token de la sesion */
        context = await browser.newContext(contextConfig);

        /* Crear una nueva page usando el context */
        page = await context.newPage();

        /* Ingresar a la pagina */
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Activar Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();
            
        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Activar Caja
        await page.getByRole('menuitem', {name: 'Activar Caja'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_activar_caja}`);

        // El titulo de Activar Caja debe estar visible
        await expect(page.locator('h1').filter({hasText: 'Activar Caja'})).toBeVisible();
    });

    test('Activar la Caja', async () => {
        // Boton Activar Caja
        const activarCaja = page.locator(`${ariaAgregar}`);
        await expect(activarCaja).toBeVisible();

        // Click al boton de Activar Caja
        await activarCaja.click();

        // Esperar que aparezca el modal
        await expect(page.getByRole('dialog', {name: ' Activar Caja'})).toBeVisible();

        // Debe mostrarse el cajero
        await expect(page.getByTitle(`${nombreTestigoCajero}`)).toBeVisible();

        // Debe mostrarse la caja
        await expect(page.getByTitle(`CAJA ${userCorrecto}`)).toBeVisible();

        // La fecha debe ser el dia actual
        await expect(page.locator('#FormNewShifts_FECHA_APERTURA_TURNO')).toHaveValue(`${diaActualFormato}`);

        // Input del turno de la caja
        const turnoCaja = page.locator('#FormNewShifts_SELECTTURNO');
        
        await expect(turnoCaja).toBeVisible();
        // Cambiar de turnos 
        await turnoCaja.fill('TURNO DEL MEDI');
        await page.locator('text=TURNO DEL MEDIO DIA').click();
        await turnoCaja.fill('TURNO DIA COMPL');
        await page.locator('(//div[@class="ant-select-item-option-content"])').filter({hasText: 'TURNO DIA COMPLETO'}).click();

        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // Debe salir el modal
        await expect(page.locator('text=¿Desea confirmar los datos del formulario?')).toBeVisible();
        // Click en Aceptar 
        const botonAceptarConfirmacion = page.getByRole('button', {name: 'check Aceptar'}).nth(1);
        await botonAceptarConfirmacion.click();  

        // Esperar tres segundos
        await page.waitForTimeout(3000);

        // Alerta de turno aperturado
        const alertaTurnoAperturado = page.locator('text=Apertura Turno almacenada correctamente.');

        // Modal de caja con un turno ya abierto
        const modalCajaAbierta = page.locator('text=Caja 130 ya tiene un turno abierto');

        // Condicion si tiene o no un turno abierto
        if (await alertaTurnoAperturado.isVisible()) {
            // Cerrar la alerta
            await page.locator(`${ariaCerrar}`).click();
        } else if (await modalCajaAbierta.isVisible()) {
            // Click al boton de Aceptar del modal
            await page.getByRole('button', {name: 'check Aceptar'}).click();
            
            // El modal debe cerrarse
            await expect(modalCajaAbierta).not.toBeVisible();
        }
    });

    test('Buscar la caja activada', async () => {
        // Digitar el nombre de la caja
        await page.locator(`${formBuscar}`).fill(`${userCorrecto}`);

        // Esperar a que cargue la pagina
        await page.waitForTimeout(2000);

        // La caja buscada debe mostrarse en la tabla
        await expect(page.getByRole('cell', {name: `${userCorrecto}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombreTestigoCajero}`})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});