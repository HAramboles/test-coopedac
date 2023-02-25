import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

/* Variables globales */

let browser: Browser;
let context: BrowserContext;
let page: Page;


/* URL de la pagina */
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

/* Pruebas */

test.describe('Pruebas con la seccion de Activar Caja', () => {
    test.beforeAll(async () => { /* Antes de las pruebas */
        // Crear el browser con la propiedad headless.
        browser = await chromium.launch({
            headless: true
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

    test('Hacer click al boton de Activar Caja', async () => {
        /* Hacer lick al boton TESORERIA */
        await page.locator('text=TESORERIA').click();

        /* Hacer lick al boton CAJAS */
        await page.locator('text=CAJAS').click();

        /* Hacer lick al boton OPERACIONES */
        await page.locator('text=OPERACIONES').click();

        /* Hacer lick al boton Activar Caja */
        await page.locator('text=Activar Caja').click();

        /* Esperar que la url cambie a activar_caja */
        await expect(page).toHaveURL(`${url_base}/activar_caja/01-4-1-2-5/`);

        /* Esperar que el titulo Activar Caja aparezca al cambiar la url */
        await expect(page.locator('h1').filter({hasText: 'Activar Caja'})).toBeVisible();
    });

    test('Agregar nueva caja', async () => {
        /* Hacer click al boton de Activar caja */
        await page.locator('[aria-label="plus"]').click();

        /* Esperar que el modal aparezaca y la seccion de comentarios este visible */
        await expect(page.locator('text=Comentario')).toBeVisible();

        /* Escribir el turno */
        const turno = page.getByRole('combobox', {name: 'Turno'});
        await turno?.fill('TURNO DIA COMPLETO');

        /* Hacer click al boton de Aceptar */
        await page.locator('[aria-label="check"]').click();

        /* Esperar que un nuevo modal aparezca y este visible la palabra confirmar */
        await expect(page.locator('span').filter({ hasText: 'Confirmar' })).toBeVisible();

        /* Hacer click al boton de aceptar en el modal de confirmacion */
        const botonAceptarConfirmacion = page.getByRole('dialog')
            .filter({hasText: 'Confirmar¿Desea confirmar los datos del formulario?CancelarAceptar' })
            .getByRole('button', { name: 'check Aceptar' });
        await botonAceptarConfirmacion.click();  
    });

    test('Mensajes si se realizo correctamente o no la activacion de la caja', async () => {
        /* Mensaje si ya existia un turno con esa caja, por lo que dio error */
        const error = page.locator('text=Error'); 

        /* Mensaje si no existia un turno con esa caja, por lo que se realizo correctamenta la operacion */
        const exito = page.locator('text=Operación Exitosa'); 

        if (await error.isVisible()) { /* El mensaje de Error debe de estar visible */
            await page.locator('[aria-label="close"]').click(); /* Hacer click a la x para cerrar el mensaje */
        }else if (await exito.isVisible()) { /* El mensaje de Operación Exitosa debe de estar visible */
            await page.locator('[aria-label="close"]').click(); /* Hacer click a la x para cerrar el mensaje */
        };
    });

    test.afterAll(async () => { /* Despues de que se realizen todas las pruebas */
        // Cerrar la pagina
        await page.close();
    
        /* Cerrar el context */
        await context.close();
    });
});
