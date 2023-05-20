import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con la Solicitud de Transferencia Interbancaria', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        browser = await chromium.launch({ 
          headless: false,
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
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Solicitud Transferencia Interbancaria', async () => {
        // Captaciones
        await page.locator("text=CAPTACIONES").click();
    
        // Operaciones
        await page.locator('text=OPERACIONES').click();
    
        // Solicitud Transferencia Interbancaria
        await page.locator('text=Solicitud Transferencia Interbancaria').click();
    
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_transferencia/01-2-2-110/`);
    
        // El titulo de Solicitud Transferencia Interbancaria
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD TRANSFERENCIA INTERBANCARIA'})).toBeVisible();
    });
    
    test('Llenar la solicitud con los datos del solicitante', async () => {
        // Titulo datos del solicitante debe estar visible
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOLICITANTE'})).toBeVisible();
    
        // Ingresar un socio
        const campoSocio = page.locator('#select-search');
        await expect(campoSocio).toBeVisible();
    
        await campoSocio?.fill(`${cedula}`);
        // Elegir la opcion con el socio buscado
        await page.locator(`text=${cedula}`).click();
    
        // Ingresar la cuenta de origen
    
        // Titulo datos transferencia
        await expect(page.locator('h1').filter({hasText: 'DATOS TRANSFERENCIA'})).toBeVisible();
    
        // Cuenta de origen
        const campoCuentaOrigen = page.locator('#form_ID_CUENTA_DEBITAR');
        await campoCuentaOrigen.click();
        // No deben mostrarse ni la cuenta de Aportaciones ni la de Aportaciones Preferentes del socio
        await expect(page.getByText('APORTACIONES', {exact: true})).not.toBeVisible();
        await expect(page.getByText('APORTACIONES PREFERENTES', {exact: true})).not.toBeVisible();

        // Seleccionar ahorros normales
        await page.locator('text=AHORROS NORMALES').click();
    
        // Elegir un monto a transferir
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
        const campoComentario = page.locator('#form_COMENTARIO');
        await expect(campoComentario).toBeVisible();
        await campoComentario?.fill('Transferencia Bancaria');
    
        // Boton de Aceptar
        const botonAceptar = page.locator('button:has-text("Aceptar")');
        // Al momento de hacer click al boton de aceptar se debe abrir una nueva pagina con la solicitud creada 
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          // Click al boton de Aceptar
          await botonAceptar.click()
        ]);
    
        // La pagina abierta con la solicitud se cierra
        await newPage.close();

        // Regresar a la pagina
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD TRANSFERENCIA INTERBANCARIA'})).toBeVisible();

        // Se debe mostrar un mensaje de que se hizo la solicitud correctamente
        await expect(page.locator('text=Encabezado programación de pagos almacenado exitosamente.')).toBeVisible();

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