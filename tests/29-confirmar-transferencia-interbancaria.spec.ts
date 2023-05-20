import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con la Confirmacion de Transferencia Interbancaria', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
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
    
        // El tipo cuenta destino debe ser el tipo elegido en la solicitud, en este caso, de ahorros
        await expect(page.getByText('CUENTA AHORROS')).toBeVisible();
    
        // El numero de Referencia es opcional, por lo que no se colocara uno, por lo que debe estar vacio
        await expect(page.locator('#form_REFERENCIA')).toHaveValue('');

        // Titulo Cargos
        await expect(page.locator('h1').filter({hasText: 'CARGOS'})).toBeVisible();

        // Debe mostrarse el cargo por bancos diferentes
        await expect(page.getByRole('row', {name: 'CARGO A OTRO BANCO Monto RD$ 100.00 RD$ 100.00'})).toBeVisible();
    
        // Activar los impuestos
        const checkImpuestos = page.locator('text=Impuestos');
        await checkImpuestos.check();

        // El impuesto debe mostrarse
        await expect(page.getByRole('row', {name: 'CARGO 0.15% Porcentaje 0.15% RD$ 0.00'})).toBeVisible();

        // Comprobar que la casilla de impuestos este checked
        await expect(checkImpuestos).toBeChecked();

        // El comentario debe estar visible
        await expect(page.locator('#form_NOTAS')).toHaveValue('Transferencia Bancaria');
    
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
        // Cerrar el context
        await context.close();
    
        // Cerrar la page
        await page.close();
    });
});
