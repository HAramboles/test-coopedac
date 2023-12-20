import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, url_confirmar_cambio_tasa_certidicado } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { formBuscar, dataCheck, dataEliminar, noData } from './utils/data/inputsButtons'

/* Variables globales */
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Confirmacion del Cambio de Tasa a Certificado', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenados en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Confirmar Cambio Tasa Certificado', async () => {
        // Captaciones
        await page.getByRole('menuitem', { name: 'CAPTACIONES' }).click();

        // Procesos
        await page.getByRole('menuitem', { name: 'PROCESOS' }).click();

        // Confirmar Cambio Tasa Cert.
        await page.getByRole('menuitem', { name: 'Confirmar Cambio Tasa Cert.' }).click();

        // La url debe cambiar
        await expect(page).toHaveURL(`${url_confirmar_cambio_tasa_certidicado}`);
    });

    test('Buscar las dos solicitud de cambio de tasa de la persona', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CAMBIOS DE TASA PENDIENTES'})).toBeVisible();

        // Eelgir buscar por el titular
        await page.locator('(//INPUT[@type="radio"])[3]').click();

        // Digitar el nombre de la persona en el buscador
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Esperar que cargue la pagina
        await page.waitForTimeout(2000);

        // Deben mostrarse las dos solicitudes de cambio de tasa de la persona
        await expect(page.getByRole('cell', {name: 'INVERSION PAGADERAS'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'FINANCIEROS REINVERTIDAS'})).toBeVisible();

        // Los botones de Aprobar y Rechazar deben estar deshabilitados
        await expect(page.getByRole('button', {name: 'Aprobar'})).toBeDisabled();
        await expect(page.getByRole('button', {name: 'Rechazar'})).toBeDisabled();
    });

    test('Confirmar el cambio de tasa del certificado Inversiones Pagaderas', async () => {
        // Tasa actual del certificado inversiones pagaderas
        await expect(page.getByRole('cell', {name: '5.00', exact: true})).toBeVisible();

        // Tasa nueva del certificado inversiones pagaderas
        await expect(page.getByRole('cell', {name: '15.00+'})).toBeVisible();

        // Click al boton de confirmar
        await page.getByRole('row', {name: 'INVERSION PAGADERAS'}).locator(`${dataCheck}`).click();

        // Aparece un mensaje modal
        const mensajeModal = page.getByText('Aprobar cambio de tasa');
        await expect(mensajeModal).toBeVisible();

        // Click al boton de aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Esperar que el modal desaparezca
        await page.waitForTimeout(2000);
        await expect(mensajeModal).not.toBeVisible();

        // Aparece un mensaje de operacion exitosa 
        const modalOperacionExitosa = page.getByText('Cambio de tasa aprobado con éxito');
        await expect(modalOperacionExitosa).toBeVisible();

        // Click al boton de aceptar del mensaje de operacion exitosa
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El mensaje de operacion exitosa desaparece
        await expect(modalOperacionExitosa).not.toBeVisible();

        // Esperar que la pagina se actualice
        await page.waitForTimeout(2000);

        // La solicitud de cambio de tasa del certificado inversiones pagaderas debe desaparecer
        await expect(page.getByRole('cell', {name: 'INVERSION PAGADERAS'})).not.toBeVisible();
    });

    test('Rechazar el cambio de tasa del certificado Financieros Reinvertidas', async () => {
        // Tasa actual del certificado Financieros Reinvertidas
        await expect(page.getByRole('cell', {name: '8.00'})).toBeVisible();

        // Tasa nueva del certificado Financieros Reinvertidas
        await expect(page.getByRole('cell', {name: '12.00+'})).toBeVisible();

        // Click al boton de rechazar
        await page.getByRole('row', {name: 'FINANCIEROS REINVERTIDAS'}).locator(`${dataEliminar}`).click();

        // Aparece un mensaje modal
        const mensajeModal = page.getByText('¿Está seguro de rechazar el cambio de tasa?');
        await expect(mensajeModal).toBeVisible();

        // Click al boton de aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Esperar que el modal desaparezca
        await page.waitForTimeout(2000);
        await expect(mensajeModal).not.toBeVisible();

        // Aparece un modal para digitar el motivo del rechazo
        const modalRechazo = page.getByText('RECHAZAR CAMBIO DE TASA');
        await expect(modalRechazo).toBeVisible();

        // Mensaje del modal
        await expect(page.locator('text=Escriba la razón por la cual se rechaza el cambio de tasa.')).toBeVisible();

        // Digitar una razon de rechazo
        await page.locator('#form_REJECT_REASON').fill('El cambio de tasa ha sido rechazado por la alta gerencia');
        await page.waitForTimeout(2000);

        // Click al boton de aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Esperar que el aparezca otro modal
        await page.waitForTimeout(2000);

        // Aparece un mensaje de operacion exitosa 
        const modalOperacionExitosa = page.getByText('Cambio de tasa rechazado');
        await expect(modalOperacionExitosa).toBeVisible();

        // Click al boton de aceptar del mensaje de operacion exitosa
        //await page.getByRole('button', {name: 'check Aceptar'}).first().click();
        await page.locator('div').filter({ hasText: /^Aceptar$/ }).getByRole('button').click();

        // El mensaje de operacion exitosa desaparece
        await expect(modalOperacionExitosa).not.toBeVisible();

        // Esperar que la pagina se actualice
        await page.waitForTimeout(1000);

        // Ahora la tabla de las solicitudes debe estar vacia
        await expect(page.getByText(`${noData}`)).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});