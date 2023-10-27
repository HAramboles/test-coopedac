import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, userCuadreCaja, passCuadreCaja, nombreOficialCuadre, contextConfig } from './utils/dataTests';
import { url_cuadre_caja } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con el Mensaje de Aviso cuando hay Recepciones Pendientes en Cuadre de Caja', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ir a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Cuadre de Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Cuadre de Caja
        await page.getByRole('menuitem', {name: 'Cuadre de Caja'}).click();
    });

    test('Colocar el usuario del Oficial de Cuadre', async () => {
        // Debe mostrarse un modal para ingresar el usuario del Oficial de Cuadre
        const modalUsuarioOficialCuadre = page.getByText('INICIO SESIÓN DE OFICIAL');
        await expect(modalUsuarioOficialCuadre).toBeVisible();

        await page.waitForTimeout(10000);

        // Colocar el usuario del Oficial de Cuadre
        const inputUsuarioOficialCuadre = page.locator('#form_username');
        await inputUsuarioOficialCuadre.clear();
        await inputUsuarioOficialCuadre.fill(`${userCuadreCaja}`);

        // Colocar la clave del Oficial de Cuadre
        const inputClaveOficialCuadre = page.locator('#form_password');
        await inputClaveOficialCuadre.clear();
        await inputClaveOficialCuadre.fill(`${passCuadreCaja}`);

        // Click al boton de Iniciar Sesion
        const botonIniciarSesion = page.getByRole('button', {name: 'Iniciar Sesión'});

        // Esperar a que el boton de Iniciar Sesion este habilitado
        await page.waitForTimeout(8000);

        await expect(botonIniciarSesion).toBeVisible();
        await botonIniciarSesion.click();

        // El modal deberia desaparecer
        await expect(modalUsuarioOficialCuadre).not.toBeVisible();
    });

    test('Tablas y totales de la pagina de Cuadre de Caja', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cuadre_caja}`);

        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CUADRE DE CAJA'})).toBeVisible();

        // La caja a cuadrar debe ser la caja en uso
        await expect(page.locator('text=CAJA BPSHARAMBOLES - HECTOR ARAMBOLES')).toBeVisible();

        // Tabla de desglose efectivo cajas
        await expect(page.locator('h1').filter({hasText: 'DESGLOSE EFECTIVO CAJAS'})).toBeVisible();

        // Tabla de arqueo fisico del efectivo
        await expect(page.locator('h1').filter({hasText: 'ARQUEO FÍSICO DEL EFECTIVO'})).toBeVisible();

        // El total de efectivo y de cheques de la tabla de arqueo fisico del efectivo deben estar en 0
        await expect(page.locator('(//INPUT[@autocomplete="off"])[52]')).toHaveValue('0.00');
        await expect(page.locator('(//INPUT[@autocomplete="off"])[53]')).toHaveValue('0.00');

        // Seccion Total del Dia
        await expect(page.locator('h1').filter({hasText: 'TOTAL DEL DÍA'})).toBeVisible();      
        await expect(page.getByText('Fondo')).toBeVisible();
        await expect(page.getByText('Efectivo (R-E)')).toBeVisible();
        await expect(page.getByText('Neto Efectivo')).toBeVisible();
        await expect(page.getByText('Total Cheques').first()).toBeVisible();

        // Oficial de Cuadre
        await expect(page.locator('#form_OFFICER_NAME')).toHaveValue(`${nombreOficialCuadre}`);
    });

    test('Distribuir decimales y no debe mostrarse erroneamente el formato de los decimales', async () => {
        // Hacer la distribucion del dinero para probar el formato de los decimales
        const cantDecimales = page.locator('[id="23"]'); // Campo de RD 0.1

        // Cantidad = 35 de 0.1
        await cantDecimales.click();
        await cantDecimales.fill('35');

        // El total de los decimales no deben tener el formato erroneo
        await expect(page.locator('[step="1"]')).not.toHaveValue('RD$ 0.35,000,000,000,000,003');

        // Borrar la cantidad agregada
        await cantDecimales.clear();
    });

    test('Distribuir el efectivo de la caja a cuadrar', async () => {
        // Hacer la distribucion del dinero para el cuadre de caja
        const cant2000 = page.locator('[id="13"]'); // Campo de RD 2000

        // Cantidad = 10 de 2000
        await cant2000.click();
        await cant2000.fill('1');

        // El total de efectivo debe tener la cantidad distribuida
        await expect(page.locator('(//INPUT[@autocomplete="off"])[52]')).toHaveValue('2,000.00');
    });

    test('Depositar a Banco los cheques de la caja', async () => {
        // Click al boton de Deposito a Banco
        const botonDepositoBanco = page.getByRole('button', {name: 'Depósito a Banco'});
        await expect(botonDepositoBanco).toBeVisible();
        await botonDepositoBanco.click();

        // Debe aparecer el modal para asignar los cheques al banco
        const modalDepositoBanco = page.getByText('DETALLE DESTINO DEL DEPÓSITO');
        await expect(modalDepositoBanco).toBeVisible();

        // Cheques sin bancos asignados
        await expect(page.locator('text=CHEQUES SIN BANCO ASIGNADO')).toBeVisible();

        // Click al boton de Asignar todos
        await page.locator('[aria-label="Select all"]').click();

        // Esperar a que se seleccionen todos los cheques
        await page.waitForTimeout(2000);

        // Seleccionar el banco de los cheques
        await page.locator('#form_ID_BANCO').click();
        // Elegir el banco Alaver
        await page.getByRole('option', {name: 'ALAVER-420010001552'}).click();

        // Debe agregarse el banco elegido a los cheques
        await expect(page.getByLabel('Detalle Destino del Depósito').getByTitle('ALAVER-420010001552')).toBeVisible();

        // Click al boton de Asignar
        const botonAsignar = page.getByRole('button', {name: 'Asignar'});
        await expect(botonAsignar).toBeVisible();
        await botonAsignar.click();

        // Esperar a que se agreguen los cheques al banco
        await page.waitForTimeout(2000);

        // Click al boton de Guardar
        const botonGuardarModal = page.getByLabel('Detalle Destino del Depósito').getByRole('button', {name: 'save Guardar'});
        await expect(botonGuardarModal).toBeVisible();
        await botonGuardarModal.click();

        // El modal debe cerrarse
        await expect(modalDepositoBanco).not.toBeVisible();
    });

    test('Guardar el Cuadre de Caja realizado', async () => {
        // Colocar un comentario
        await page.getByPlaceholder('Comentario (Opcional)').fill('Finalizando las pruebas con el Cuadre de Caja del Dia');

        // Click al boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Debe aparecer un modal de confirmacion
        const modalConfirmacion = page.getByText('FALTANTE en caja de');
        await expect(modalConfirmacion).toBeVisible();

        // Click al boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Se abre una nueva ventana con el reporte del Cuadre de Caja
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();

        // Debe aparecer un mensaje de operacion
        await expect(page.locator('text=Operación Exitosa')).toBeVisible();
        await expect(page.locator('text=Cuadre caja enc. almacenada exitosamente.')).toBeVisible();

        // Click al boton de Ir a Inicio
        const botonIrAInicio = page.getByRole('button', {name: 'Ir a inicio'});
        await expect(botonIrAInicio).toBeVisible();
        await botonIrAInicio.click();

        // La URL debe cambiar a la pagina de inicio
        await expect(page).toHaveURL(`${url_base}`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
