import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, contextConfig, fechaInicio, fechaFin, tipoTransaccion, dataEliminar, razonAnulacion } from './utils/dataTests';
import { url_anular_cobro_oficina } from './utils/urls';
import { diaActualFormato } from './utils/fechas';

// Variables globales 
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona que solicito la linea de credito
let nombrePersona: string | null;
let apellidoPersona: string | null;

// Nombre y apellido de la persona que saldo la linea de credito
let nombreTercero: string | null;
let apellidoTercero: string | null;

// Pruebas
test.describe.serial('Pruebas Anulando Cobro de Oficina', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Dirigirse a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona fisica almacenada en el state
        nombrePersona = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellidoPersona = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Nombre y apellido de la persona relacionada almacenada en el state
        nombreTercero = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellidoTercero = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
    });

    test('Ir a la pagina de Anular Cobro Oficina', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Cobro Oficina
        await page.getByRole('menuitem', {name: 'Anular Cobro Oficina'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_cobro_oficina}`);
    });

    test('Seccion de Criterio de Busqueda de la pagina de Anular Cobro Oficina', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULAR COBRO OFICINA'})).toBeVisible();

        // Seccion criterio de busqueda debe estar visible
        await expect(page.getByText('Criterio de búsqueda')).toBeVisible();

        // Tipo de transaccion
        await expect(page.locator(`${tipoTransaccion}`)).toHaveValue('NDCOB - NOTAS CREDITO');

        // Input Id documento y cuenta origen deben estar vacios
        await expect(page.locator('#form_ID_DOCUMENTO')).toHaveValue('');
        await expect(page.locator('#form_ID_CUENTA')).toHaveValue('');

        // Usuario
        await expect(page.getByTitle('Usuario')).toBeVisible();
        await expect(page.getByTitle('TODOS')).toBeVisible();

        // Fecha inicial y final deben tener el dia actual
        const fechaDeInicio = page.locator(`${fechaInicio}`);
        const fechaDeFin = page.locator(`${fechaFin}`);

        await expect(fechaDeInicio).toHaveValue(`${diaActualFormato}`);
        await expect(fechaDeFin).toHaveValue(`${diaActualFormato}`);

        // Fecha incial y final deben estar readonly
        await expect(fechaDeInicio).toHaveAttribute('readonly', '');
        await expect(fechaDeFin).toHaveAttribute('readonly', '');
    });

    test('La tabla donde se colocan las transacciones debe estar visible', async () => {
        // Tabla de las transacciones
        await expect(page.getByRole('columnheader', {name: 'Caja'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Fecha Doc.'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Fecha Reg.'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'No. Documento'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Tipo Transacción'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'No. transacción Contable'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cuenta'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cliente'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cajero'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Estado'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Monto Ingreso'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Monto Egreso'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Hora Reg.'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Acciones'})).toBeVisible();
    });
    
    test('Anular el cobro de oficina por parte del tercero a la Linea de Credito', async() => {
        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Deben mostrarse las nota de credito de la persona fisica y del tercero
        await expect(page.getByRole('cell', {name: `${nombrePersona} ${apellidoPersona}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombreTercero} ${apellidoTercero}`})).toBeVisible();

        // Anular la transaccion del tercero
        await page.getByRole('row', {name: `${nombreTercero} ${apellidoTercero}`}).locator(`${dataEliminar}`).click();

        // Debe aparecer un modal para colocar la razon de la anulacion
        const modalAnulacion = page.getByText('Razón de la Anulación');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon en el input de comentario
        await page.locator(`${razonAnulacion}`).fill('Anular cobro de oficina realizado por tercero');

        // Click al boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Debe aparecer un mensaje modal de operacion exitosa
        await expect(page.getByText('Operación Exitosa')).toBeVisible();

        // Click al boton de Aceptar del modal de Operacion Exitosa
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // No deben mostrarse las nota de credito de la persona fisica y del tercero
        await expect(page.getByRole('cell', {name: `${nombrePersona} ${apellidoPersona}`})).not.toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombreTercero} ${apellidoTercero}`})).not.toBeVisible(); 
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();
        
        // Cerrar el context
        await context.close();
    });
});
