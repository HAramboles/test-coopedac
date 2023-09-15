import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, ariaCerrar, selectBuscar, browserConfig, formComentario } from './utils/dataTests';
import { url_solicitud_transferencia_interbancaria } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Solicitud de Transferencia Interbancaria', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
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
    
        // Ingresar a la url de la pagina
        await page.goto(`${url_base}`);
        
        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Solicitud Transferencia Interbancaria', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();
    
        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
    
        // Solicitud Transferencia Interbancaria
        await page.getByRole('menuitem', {name: 'Solicitud Transferencia Interbancaria'}).click();
    
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_transferencia_interbancaria}`);
    
        // El titulo de Solicitud Transferencia Interbancaria debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD TRANSFERENCIA INTERBANCARIA'})).toBeVisible();
    });
    
    test('Llenar la solicitud con los datos del solicitante', async () => {
        // Titulo datos del solicitante debe estar visible
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOLICITANTE'})).toBeVisible();
    
        // Ingresar un socio
        const campoSocio = page.locator(`${selectBuscar}`).first();
        await expect(campoSocio).toBeVisible();
    
        await campoSocio?.fill(`${cedula}`);
        // Elegir la opcion con el socio buscado
        await page.locator(`text=${cedula}`).click();
    
        // Ingresar la cuenta de origen
    
        // Titulo datos transferencia
        await expect(page.locator('h1').filter({hasText: 'DATOS TRANSFERENCIA'})).toBeVisible();
    
        // Cuenta de origen
        const campoCuentaOrigen = page.locator(`${selectBuscar}`).last();
        await campoCuentaOrigen.click();
        // No debe mostrarse ni la cuenta de Aportaciones del socio
        await expect(page.getByText('APORTACIONES', {exact: true})).not.toBeVisible();

        // Seleccionar ahorros normales
        await page.locator('text=AHORROS NORMALES').click();
    
        // Digitar un monto a transferir
        const campoMontoTransferir = page.locator('#form_MONTO_TRANSF');
        await expect(campoMontoTransferir).toBeVisible();
        await campoMontoTransferir?.fill('50');
    
        // Datos del beneficiario
    
        // Titulo de datos beneficiario
        await expect(page.locator('h1').filter({hasText: 'DATOS BENEFICIARIO'})).toBeVisible();
    
        // Como el socio es su propio beneficiario, solo es necesario activar la opcion de Socio es Beneficiario
        await page.locator('text=Socio es beneficiario').click();
    
        // Seleccionar tipo de cuenta
        await page.locator('text=CUENTA AHORROS').click();
    
        // No. de cuenta
        const campoNoCuenta = page.locator('#form_ID_CUENTA_DESTINO');
        await expect(campoNoCuenta).toBeVisible();
        await campoNoCuenta?.fill('12345689'); 
    
        // Banco de destino
        const campoBancoDestino = page.locator('#form_ID_BANCO_DESTINO');
        await campoBancoDestino.click();
        await campoBancoDestino.fill('BANRES'); 
        // Seleccionar Banreservas
        await page.locator('text=BANRESERVAS').click();
    
        // Titular / Apoderado
        await page.locator('#form_TITULAR_APODERADO').click();
        // Seleccionar al titular
        await page.getByRole('option', {name: `${nombre} ${apellido}`}).click();
    
        // Agregar un comentario (Opcional)
        const campoComentario = page.locator(`${formComentario}`);
        await expect(campoComentario).toBeVisible();
        await campoComentario?.fill('Transferencia Bancaria');
    
        // Boton de Aceptar
        const botonAceptar = page.locator('button:has-text("Aceptar")');
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click()

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Esperar que el reporte este visible
        await page1.waitForTimeout(4000);
    
        // La pagina abierta con la solicitud se cierra
        await page1.close();

        // Regresar a la pagina
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD TRANSFERENCIA INTERBANCARIA'})).toBeVisible();

        // Se debe mostrar un mensaje de que se hizo la solicitud correctamente
        await expect(page.locator('text=Encabezado programación de pagos almacenado exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator(`${ariaCerrar}`).click();
    });
    
    test.afterAll(async () => { // Despues de las pruebas
    // Cerrar la page 
    await page.close();

    // Cerrar el context
    await context.close();
    });
});