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

test.describe('Pruebas con la Sesion en Transito luego de enviar a Caja el Pago de un Prestamo', () => {
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

    test('Ir a la opcion de Sesiones en Transito', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Sesiones en Transito
        await page.getByRole('menuitem', {name: 'Sesiones en Tránsito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/sesiones_transito/01-4-1-2-1/`);
    });

    test('Buscar al Socio con la sesion abierta', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'SESIONES EN TRÁNSITO'})).toBeVisible();

        // Boton Actualizar
        const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
        await expect(botonActualizar).toBeVisible();
        await botonActualizar.click();

        // Buscar al socio
        await page.locator('#form_search').fill(`${nombre} ${apellido}`);

        // Se debe mostrar el socio y el area emisora debe ser caja
        await expect(page.getByText('COBROS')).toBeVisible();

        // Boton de liberar sesion
        await expect(page.getByRole('button', {name: 'Liberar Sesión'})).toBeVisible();

        // Boton Seleccionar la sesion
        const botonSeleccionar = page.getByRole('button', {name: 'Seleccionar'});
        await expect(botonSeleccionar).toBeVisible();
        await botonSeleccionar.click();
    });

    test('Ingresos en Transito del Cobro en Caja del Pago al Prestamo', async () => {
        // Se debe redirigir a las transacciones de caja
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2`);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();

        // Colocaciones
        await expect(page.locator('h1').filter({hasText: 'COLOCACIONES'})).toBeVisible();

        // Producto, Credito Hipotecario
        await expect(page.getByText('CRÉDITO HIPOTECARIO')).toBeVisible();

        // Monto del prestamo
        await expect(page.getByText('50,000.00')).toBeVisible();

        // Ingresos en Transito
        await expect(page.locator('h1').filter({hasText: 'INGRESOS EN TRÁNSITO'})).toBeVisible();

        // Operacion
        await expect(page.getByText('RECIBO DE PRESTAMOS')).toBeVisible();

        // Monto
        await expect(page.getByText('25,000.00').first()).toBeVisible();

        // El total debe ser igual al monto
        await expect(page.getByRole('strong', {name: 'Total: 25,000.00'})).toBeVisible();
    });

    test('Aplicar la transaccion', async () => {
        // Aplicar el pago al prestamo
        await page.locator('text=Aplicar').click();

        // Debe salir un modal para la distribucion de ingresos
        await expect(page.locator('text=DISTRIBUCIÓN DE INGRESOS')).toBeVisible();

        // El modal debe contener 4 titulos y todos deben estar visibles
        await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();

        // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
        const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
        await expect(iconoAlerta).toBeVisible();

        // Hacer la distribucion del pago al prestamo, 25,000
        const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000

        // Cantidad = 20 de 1000
        await cant1000.click();
        await cant1000.fill('25');

        // El icono de la alerta roja ya no debe estar visible al hacer la distribucion correctamente
        await expect(iconoAlerta).not.toBeVisible();

        // Iconos check verdes
        const iconoVerde1 = page.getByRole('img', {name: 'check-circle'}).first();
        const iconoVerde2 = page.getByRole('img', {name: 'check-circle'}).last();

        // Los dos checks verdes deben salir al hacer bien la distribucion
        await expect(iconoVerde1).toBeVisible();
        await expect(iconoVerde2).toBeVisible();

        // Hacer click al boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
        // Se abrira una nueva pagina con el reporte del deposito
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
        
        // La pagina abierta con el reporte del deposito se debe cerrar
        await newPage.close();

        // Regresar a la pagina de las transacciones de caja
        await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2`);

        // No debe mostrarse el ingreso en transito
        await expect(page.getByText('No hay datos').first()).toBeVisible();
    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
