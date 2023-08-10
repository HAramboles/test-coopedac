import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/fechas';
import { url_base, ariaCerrar, dataGuardar, browserConfig } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// activity parameters of the option
interface ActivityParameters {
    ID_MONEDA_DEFECTO: 'RD' | 'US' | ''
    FECHA_DIA_AUTO: 'S' | 'N' | '' 
}

/**
 * this an array with the differents scenaries for test, this is posible 
 * manipuling the response of /activity_parameters request and change this response for
 * the scenaries values
 */

const testScenaries: ActivityParameters[] = [
    {
        FECHA_DIA_AUTO: 'S',
        ID_MONEDA_DEFECTO: 'RD',
    },
    {
        FECHA_DIA_AUTO: 'N',
        ID_MONEDA_DEFECTO: 'RD',
    },
    {
        FECHA_DIA_AUTO: 'S',
        ID_MONEDA_DEFECTO: 'US',
    },
    {
        FECHA_DIA_AUTO: 'N',
        ID_MONEDA_DEFECTO: 'US',
    },
    {
        FECHA_DIA_AUTO: '',
        ID_MONEDA_DEFECTO: 'US',
    },
    {
        FECHA_DIA_AUTO: 'N',
        ID_MONEDA_DEFECTO: '',
    },
    {
        FECHA_DIA_AUTO: '',
        ID_MONEDA_DEFECTO: '',
    },
];

// Pruebas
test.describe.serial('Pruebas con el Registro de Tasa', async () => {
    for (const scenarie of testScenaries) {
        test.describe(`Test cuando el escenario es: ${Object.values(scenarie).toString()}`, () => {
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

                // Crear una nueva page
                page = await context.newPage();

                // event for request /actividad_parametro
                await page.route(/\/actividad_parametro/, async route => {
                    // Fetch original response.
                    const response: APIResponse = await page.request.fetch(route.request());
                    // Add a prefix to the title.
                    const body = await response.json();
                    // condition for override response body
                    if (Object.keys(body?.data).length > 1) {
                        // replace the response body with the scenarie data
                        body.data = Object.assign(body.data, scenarie)
                        route.fulfill({
                            // Pass all fields from the response.
                            response,
                            // Override response body.
                            body: JSON.stringify(body),
                        });
                    } else {
                        route.continue();
                    }
                });

                // expect that the project url exists and the length > 0
                expect((`${url_base}`.length || 0) > 0).toBeTruthy();

                // Go to project URL
                await page.goto(`${url_base}`);
            });

            test('Ir a la opcion de Registrar Tasa', async () => {
                // Click text=CONFIGURACION
                await page.locator('text=CONFIGURACION').click();
                // Click text=MONEDAS, CALCULOS
                await page.locator('text=MONEDAS, CALCULOS').click();
                // Click [id="\30 1-99-4\$Menu"] div:has-text("Registro Tasa Simple")
                await page.locator('div > span:has-text("Registro Tasa Simple")').click();

                // expect that the URL is correct
                await expect(page).toHaveURL(/\/registro_tasa/);
            });

            test('Los titulos deben estar visibles', async () => {
                await expect(page.locator('text=Tasas de cambio del día')).toBeVisible()
                await expect(page.locator('text=Historial De Tasas Registradas')).toBeVisible();
            });

            test('Registrar Tasa', async () => {
                // Click button:has-text("Agregar")
                await page.locator('button:has-text("Agregar")').click();

                // check for scenaries
                const form_FECHA = await page.locator('#form_FECHA').inputValue()
                if (scenarie.FECHA_DIA_AUTO === 'S') {
                    expect(form_FECHA).toBe(formatDate(new Date()));
                } else if (scenarie.FECHA_DIA_AUTO === 'N' || scenarie.FECHA_DIA_AUTO === '') {
                    expect(form_FECHA).toBe('');
                };

                const selectMoney = await page.locator('(//span[@class="ant-select-selection-item"])').first().textContent()
                if (scenarie.ID_MONEDA_DEFECTO) {
                    expect(selectMoney).toBe(scenarie.ID_MONEDA_DEFECTO);
                } else {
                    expect(selectMoney).toBe('');
                };

                // Condicion si se va a agregar o no una nueva tasa del dia
                if (scenarie.FECHA_DIA_AUTO === 'S' && scenarie.ID_MONEDA_DEFECTO === 'US') {
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

                    // Alertas que se mostraran si se registro la tasa correctamente o no
                    const AlertaExito = page.locator('text=Operación Exitosa');
                    const AlertaError = page.locator('text=Error');

                    if (await AlertaExito.isVisible()) { // Si no hay una tasa registrada y se registro correctamente la tasa
                        // Contenido de la alerta
                        await expect(page.locator('text=Moneda historial almacenado exitosamente.')).toBeVisible();
                        
                        // Cerrar la alerta
                        await page.locator(`${ariaCerrar}`).click();

                        // La alerta no debe estar visible
                        await expect(AlertaExito).not.toBeVisible();

                    } else if (await AlertaError.isVisible()) { // Si ya hay una tasa registrada y no se registro la tasa
                        // Contenido de la alerta
                        await expect(page.locator('text=Ya existe un registro con esta moneda')).toBeVisible();

                        // Cerrar la alerta
                        await page.locator(`${ariaCerrar}`).click();

                        // La alerta no debe estar visible
                        await expect(AlertaError).not.toBeVisible();
                    };

                    // La moneda agregada debe estar en la table de monedas
                    await expect(page.getByText('DOLARES (US)').first()).toBeVisible();

                } else if (scenarie.FECHA_DIA_AUTO === 'N' || scenarie.FECHA_DIA_AUTO === '' && scenarie.ID_MONEDA_DEFECTO === 'US') {
                    test.skip();
                } else if (scenarie.ID_MONEDA_DEFECTO === 'RD' || scenarie.ID_MONEDA_DEFECTO === '') {
                    test.skip();
                }
            });

            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});    
