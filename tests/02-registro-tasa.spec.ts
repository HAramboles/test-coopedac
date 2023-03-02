import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

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
]

// Annotate entire file as serial.
test.describe.configure({mode: 'parallel'});

test.describe('Pruebas con el Registro de Tasa', async () => {
  for (const scenarie of testScenaries) {
    test.describe(`Test cuando el escenario es: ${Object.values(scenarie).toString()}`, async () => {
      test.beforeAll(async () => {
        browser = await chromium.launch({
          headless: true,
        });

        // Create a new context with the saved storage state.
        context = await browser.newContext({
          storageState: 'state.json'
        });

        // create a new page
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
            // if the condition is not true, then continue
            route.continue()
          }
        });

        // expect that the project url exists and the length > 0
        expect((`${url_base}`.length || 0) > 0).toBeTruthy()

        // Go to project URL
        await page.goto(`${url_base}`);
      });

      test('Ir a la opcion de Registrar Persona', async () => {
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
          expect(form_FECHA).toBe(formatDate(new Date()))
        } else if (scenarie.FECHA_DIA_AUTO === 'N' || scenarie.FECHA_DIA_AUTO === '') {
          expect(form_FECHA).toBe('')
        };

        const selectMoney = await page.locator('(//span[@class="ant-select-selection-item"])[1]').textContent()
        if (scenarie.ID_MONEDA_DEFECTO) {
          expect(selectMoney).toBe(scenarie.ID_MONEDA_DEFECTO)
        } else {
          expect(selectMoney).toBe('')
        };
        
        // Condicion si se va a agregar o no una nueva tasa del dia
        if (scenarie.FECHA_DIA_AUTO === 'S' && scenarie.ID_MONEDA_DEFECTO === 'US') {
          // Click input[role="spinbutton"]
          await page.locator('input[role="spinbutton"]').click();

          // Fill input[role="spinbutton"]
          await page.locator('input[role="spinbutton"]').fill('56');

          // Click en guardar tasa
          await page.locator('[data-icon="save"]').click();

          // Click button:has-text("Aceptar")
          await page.locator('button:has-text("Aceptar")').click();

          // Mensajes que se mostraran si se registro la tasa correctamente o no
          const mensajeExito = page.locator('text=Moneda historial almacenado exitosamente.');
          const mensajeError = page.locator('text=Ya existe un registro con esta moneda');

          if (await mensajeExito.isVisible()) { // Si no una tasa registrada y se registro correctamente la tasa
            // Cerrar el mensaje
            await page.locator('[aria-label="close"]').click();
          } else if (await mensajeError.isVisible()) { // Si ya hay una tasa registrada y no se registro la tasa
            // Cerrar el mensaje
            await page.locator('[aria-label="close"]').click();
          };

        } else if (scenarie.FECHA_DIA_AUTO === 'N' || scenarie.FECHA_DIA_AUTO === '' && scenarie.ID_MONEDA_DEFECTO === 'US') {
          test.skip();
        } else if (scenarie.ID_MONEDA_DEFECTO === 'RD' || scenarie.ID_MONEDA_DEFECTO === '') {
          test.skip();
        };
      });

      test.afterAll(async () => {
        // Cerrar la pagina
        await page.close();

        /* Cerrar el context */
        await context.close();
      });
    });
  };
});