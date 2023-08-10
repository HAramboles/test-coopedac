import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, ariaCerrar, browserConfig } from './utils/dataTests';

/* Variables globales */
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Activar Caja - Pruebas con los diferentes parametros', async () => {
    test.beforeAll(async () => { // Antes de que se realicen todas las pruebas
        /* Crear el browser, con la propiedad headless */
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        /* Crear un context con el storageState donde esta guardado el token de la sesion */
        context = await browser.newContext({
            storageState: 'state.json'
        });

        /* Crear una nueva page usando el context */
        page = await context.newPage();

        /* Ingresar a la pagina */
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Activar Caja', async () => {
        // Tesoreria
        await page.locator('text=TESORERIA').click();

        // Cajas
        await page.locator('text=CAJAS').click();

        // Operaciones
        await page.locator('text=Operaciones').click();

        // Activar Caja
        await page.locator('text=Activar Caja').click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_base}/activar_caja/01-4-1-2-5/`);

        // El titulo de Activar Caja debe estar visible
        await expect(page.locator('h1').filter({hasText: 'Activar Caja'})).toBeVisible();
    });

    test('Activar Nueva Caja', async () => {
        // Boton Activar Caja
        const activarCaja = page.locator('[aria-label="plus"]');
        await expect(activarCaja).toBeVisible();

        // Click al boton de Activar Caja
        await activarCaja.click();

        // Esperar que aparezca el modal
        await expect(page.getByRole('dialog', {name: ' Activar Caja'})).toBeVisible();

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
        const botonAceptarConfirmacion = page.getByRole('dialog')
            .filter({hasText: 'Confirmar¿Desea confirmar los datos del formulario?CancelarAceptar'})
            .getByRole('button', {name: 'check Aceptar'});
        await botonAceptarConfirmacion.click();  

        /* Mensaje si ya existia un turno con esa caja, por lo que dio error */
        const error = page.locator('text=Error'); 
        /* Mensaje si no existia un turno con esa caja, por lo que se realizo correctamenta la operacion */
        const exito = page.locator('text=Operación Exitosa'); 

        if (await error.isVisible()) { /* El mensaje de Error debe de estar visible */
            await page.locator(`${ariaCerrar}`).click(); /* Hacer click a la x para cerrar el mensaje */
        } else if (await exito.isVisible()) { /* El mensaje de Operación Exitosa debe de estar visible */
            await page.locator(`${ariaCerrar}`).click(); /* Hacer click a la x para cerrar el mensaje */
        };
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});