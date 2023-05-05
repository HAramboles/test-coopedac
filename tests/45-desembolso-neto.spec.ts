import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate, primerDiaMes } from './utils/utils';

// Variabes globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con el Desembolso Neto', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    }); 

    test('Ir a la opcion de Desembolso Neto', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Desembolso Neto
        await page.getByRole('menuitem', {name: 'Desembolso Neto'}).click();

        // La URL de la pagina debe cambiar
        await expect(page).toHaveURL(`${url_base}/desembolso_neto/01-3-4-9/`);
    });

    test('Imprimir el Reporte del Desembolso Neto', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'DESEMBOLSO NETO'})).toBeVisible();
        
        // Fecha Inicial
        await expect(page.locator('#form_FECHA_INICIO')).toHaveValue(`${primerDiaMes}`);

        // Fecha Final
        await expect(page.locator('#form_FECHA_FINAL')).toHaveValue(`${formatDate(new Date())}`);

        // Tipo Prestamo
        await expect(page.locator('#form_ID_TIPO_PRESTAMO')).toBeVisible();

        // Oferta
        await expect(page.locator('#form_ID_OFERTA')).toBeVisible();

        // Oficial Cobro
        await expect(page.locator('#form_ID_EJECUTIVO')).toBeVisible();

        // Centro Costo
        await expect(page.locator('#form_ID_CENTRO_COSTO')).toBeVisible();

        // Grupo
        await expect(page.locator('#form_ID_GRUPO')).toBeVisible();

        // Cartera Cobro
        await expect(page.locator('#form_ID_CARTERA')).toBeVisible();

        // Generar Reporte Desembolso Neto
        const generarReporte = page.getByRole('button', {name: 'Generar Reporte'});
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(generarReporte).toBeVisible(),
            await generarReporte.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close();
    });

    test('Probar los controles de la fecha - Fecha Final', async () => { 
        // Sumarle un dia a la fecha actulal
        const dia = new Date();
        dia.setDate(dia.getDate() + 1);

        // Borrar la fech del input de fecha final
        const fechaFinal = page.locator('#form_FECHA_FINAL');
        await fechaFinal.clear();
        // Coloacar una fecha mayor al dia actual
        await fechaFinal.fill(`${formatDate(dia)}`);

        // Click fuera del input
        await page.locator('text=Centro Costo').click();

        // Debe salir un mensaje de error
        await expect(page.getByText('Rango de Fecha inválido.')).toBeVisible();

        // Colocar la fecha actual
        await fechaFinal.fill(`${formatDate(new Date())}`);
    });

    test('Probar los controles de la fecha - Fecha Inicial', async () => { 
        // Sumarle un dia a la fecha actual
        const dia = new Date();
        dia.setDate(dia.getDate() + 1);

        // Borrar la fecha del input de fecha final
        const fechaFinal = page.locator('#form_FECHA_INICIO');
        await fechaFinal.clear();
        // Coloacar una fecha mayor al de la fecha final
        await fechaFinal.fill(`${formatDate(dia)}`);

        // Click al boton de generar reporte
        const generarReporte = page.getByRole('button', {name: 'Generar Reporte'});
        await generarReporte.click();

        // Debe salir un mensaje de error
        await expect(page.getByText('La fecha inicial no puede ser mayor a la fecha final')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[aria-label="close"]').click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
