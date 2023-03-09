import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Test con Solicitud Transferencia Interbancaria', async () => {
  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
    });

    // Crear el context
    context = await browser.newContext({
      storageState: 'state.json'
    });

    // Crear una nueva page
    page = await context.newPage();

    // Ingresar a la url de la pagina
    await page.goto(`${url_base}`);

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

    // Cedula de la persona almacenada en el state
    const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

    await campoSocio?.fill(`${cedula}`);
    // Elegir la opcion con el socio buscado
    await page.locator(`text=${cedula}`).click();

    // Ingresar la cuenta de origen

    // Titulo datos transferencia
    await expect(page.locator('h1').filter({hasText: 'DATOS TRANSFERENCIA'})).toBeVisible();

    // Cuenta de origen
    const campoCuentaOrigen = page.locator('#form_ID_CUENTA_DEBITAR');
    await campoCuentaOrigen.click();
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
    // Seleccionar Alaver
    await page.locator('text=ALAVER').click();

    // Agregar un comentario (Opcional)
    const campoComentario = page.locator('#form_COMENTARIO');
    await expect(campoComentario).toBeVisible();
    await campoComentario?.fill('Prueba de transferencia bancaria');

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
  });

  test('Ir a la opcion de Confirmar Transferencia Interbancaria', async () => {
    // Tesoreria
    await page.getByRole('menuitem', {name: 'TESORERIA'}).getByText('TESORERIA').click();

    // Bancos
    await page.locator('text=BANCOS').click();

    // Procesos
    await page.getByRole('menuitem', {name: 'PROCESOS'}).getByText('PROCESOS').click();

    // Confirmar Transferencia Interbancaria
    await page.locator('text=Confirmar Transferencia Interbancaria').click();

    // La URL debe de cambiar
    await expect(page).toHaveURL(`${url_base}/confirmar_transferencia_interbancaria/01-4-2-3-2/`);

    // El titulo de Confirmar Transferencia debe estar visible
    await expect(page.locator('h1').filter({hasText: 'CONFIRMAR TRANSFERENCIA INTERBANCARIA'})).toBeVisible();
  });

  test('El nombre de la columna Usuario y Documento deben estar visibles, ya que hubo un cambio en los nombres anteriores', async () => {
    // Columna Usuario 
    await expect(page.locator('text=Usuario')).toBeVisible();

    // Columna Documento
    await expect(page.locator('text=Documento')).toBeVisible();
  });

  test('Click al boton de confirmar transferencia', async () => {
    // Nombre y el apellido de la persona almacenada en el state
    const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
    const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

    // Seleccionar el boton de confirmar transferencia asociado al nombre y apellido de la persona
    const botonConfirmarTransferencia = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'check-circle'});
    await expect(botonConfirmarTransferencia).toBeVisible();
    await botonConfirmarTransferencia.click();
  });

  test('Llenar los campos necesarios para la Confirmacion de la Transferencia Interbancaria', async () => {
    // El titulo principal dbe estar visible
    await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIA INTERBANCARIA'})).toBeVisible();
    
    // Seleccionar un Banco de Origen
    const campoBancoOrigen = page.locator('#form_ID_BANCO');
    await campoBancoOrigen.click();
    // Elegir un banco de las opciones que aparecen
    await page.locator('text=COOPEDAC').click();

    // Ingresar un codigo de referencia
    const campoNoReferencia = page.locator('#form_REFERENCIA');
    await expect(campoNoReferencia).toBeVisible();
    await campoNoReferencia?.fill('987654321'); 

    // Activar los impuestos
    await page.locator('text=Impuestos').click();

    // Click al boton de guardar
    const botonGuardar = page.locator('button:has-text("Guardar")');
    await botonGuardar.click();

    // Debe de aparecer un modal confirmando que la operacion fue exitosa
    await expect(page.locator('text=Transferencia aplicada exitosamente.')).toBeVisible();
    // Click a aceptar
    await page.locator('text=Aceptar').click();

    // Se debe de redirigir a la pagina de las transferencias pendientes, la URL debe cambiar
    await expect(page).toHaveURL(/\/confirmar_transferencia_interbancaria/);
  });

  test.afterAll(async () => { 
    // Cerrar la page 
    await page.close();

    // Cerrar el context
    await context.close();
  });
});
