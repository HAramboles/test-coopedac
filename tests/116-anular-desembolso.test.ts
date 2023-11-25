import { Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { formBuscar, dataCancelar } from './utils/data/inputsButtons';
import { url_base, url_anular_desembolso, url_solicitud_credito } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la empresa
let nombreEmpresa: string | null;

// Variables usadas en ambos casos
let modalAnularDesembolso: Locator;
let razonAnulacion: Locator;
let botonAceptar: Locator;

// Monto del deseembolso
const cantMonto:string = '300,000';

// Pruebas
test.describe.serial('Pruebas con la Anulacion de Desembolso', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ir a la pagina principal
        await page.goto(`${url_base}`);

        // Nombre de la empresa almacenada en el state
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));

        // Variables usadas en ambos casos
        modalAnularDesembolso = page.locator('h1').filter({hasText: 'ANULAR DESEMBOLSO'});
        razonAnulacion = page.locator('#form_RAZON_ANULACION');
        botonAceptar = page.getByRole('button', {name: 'Aceptar'});
    });

        // Funcion para cerrar las paginas que se abren con los diferentes reportes en los pasos de la solicitud de credito
        const CerrarPaginasReportes = async () => {
            context.on('page', async (page) => {
                await page.waitForTimeout(1000);
                await page.close();
            });
        };

    test('Ir a la opcion de Anular Desembolso', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Desembolso
        await page.getByRole('menuitem', {name: 'Anular Desembolso'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_desembolso}`);
    });

    test('Anular el Desembolso de la Solicitud de Credito Agricola de la Persona Juridica', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULACIÓN DE DESEMBOLSO'})).toBeVisible();

        // Digitar el nombre de la empresa
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Debe mostrarse la solicitud desembolsada de la empresa
        const solicitudDesembolsadaEmpresa = page.getByRole('row', {name: `${nombreEmpresa}`});
        await expect(solicitudDesembolsadaEmpresa).toBeVisible();

        // Click al boton de Anular Desembolso
        await solicitudDesembolsadaEmpresa.locator(`${dataCancelar}`).click();

        // Debe aparecer un modal para anular el desembolso
        await expect(modalAnularDesembolso).toBeVisible();

        // Seleccionar el desembolso del prestamo
        await page.getByRole('checkbox').last().click();

        // Digitar una razon de la anulacion del desembolso
        await razonAnulacion.fill('Debe desembolsarse nuevamente el prestamo');

        // Click al boton de Anular Desembolso
        const botonAnularDesembolso = page.getByRole('button', {name: 'Desembolso', exact: true});
        await expect(botonAnularDesembolso).toBeVisible();
        await botonAnularDesembolso.click();

        // Debe aparecer un modal de confirmacion
        await expect(page.locator('text=¿Está seguro de cancelar el desembolso?')).toBeVisible();

        // Click al boton de Aceptar
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que el modal se cierre
        await page.waitForTimeout(3000);

        // El modal de Anular Desembolso debe desaparecer
        await expect(modalAnularDesembolso).not.toBeVisible();

        // Aparece una alerta de que se anulo el desembolso
        await expect(page.locator('text=Operacion completada con exito')).toBeVisible();    
    });

    test('Ir a la opcion de Solicitud de Credito', async () => {
        // Click a Contraer todo
        await page.locator('text=Contraer todo').click();

        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();
        
        // Solicitud de Credito
        await page.getByRole('menuitem', {name: 'Solicitud de Crédito'}).click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Cambiar el estado a aprobado
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=APROBADO').click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=aprobado`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
    });

    test('Desembolsar nuevamente la Solicitud de la persona Juridica', async () => {
        // Buscar la solicitud de credito de la persona juridica
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Elegir la solicitud de la persona juridica
        await page.getByRole('row', {name: `${nombreEmpresa}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en aprobado
        await expect(page).toHaveURL(/\/aprobado/);

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // El nombre y el apellido del socio deben estar visibles
        await expect(page.getByText(`Socio: ${nombreEmpresa}`)).toBeVisible();

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

        // La tabla de cuentas de cobros debe estar visible
        await expect(page.getByRole('row', {name: 'Principal Tipo de cuenta No. Cuenta Titular Acciones'})).toBeVisible();

        // La cuenta de cobro debe estar visible
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();

        // Monto a desembolsar
        const montoDesembolsar = page.getByText(`RD$ ${cantMonto}`).nth(1);

        // El monto a desembolsar debe estar visible
        if (await montoDesembolsar.isVisible()) {
            // Desembolsar la solicitud
            const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
            await expect(botonDesembolsar).toBeVisible();
            await botonDesembolsar.click();

            // Cerrar las paginas que se abren con los diferentes reportes
            CerrarPaginasReportes();

        } else {
            // Volver al paso anterior
            await page.getByRole('button', {name: 'Anterior'}).click();

            // La URL debe cambiar
            await expect(page).toHaveURL(/\/?step=9/);

            // Esperar que la pagina cargue
            await page.waitForTimeout(3000);

            // Volver al paso 10
            await page.getByRole('button', {name: 'Siguiente'}).click();

            // La URL debe cambiar
            await expect(page).toHaveURL(/\/?step=10/);

            // Esperar que la pagina cargue
            await page.waitForTimeout(3000);

            // Desembolsar la solicitud
            const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
            await expect(botonDesembolsar).toBeVisible();
            await botonDesembolsar.click();

            // Cerrar las paginas que se abren con los diferentes reportes
            CerrarPaginasReportes();
        };

        // Debe regresar a la pagina de las solicitudes en estado aprobado
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=aprobado`);
    });

    test('Ir a la opcion de Anular Desembolso nuevamente', async () => {
        // Click a Contraer todo
        await page.locator('text=Contraer todo').click();

        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Desembolso
        await page.getByRole('menuitem', {name: 'Anular Desembolso'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_desembolso}`);
    });

    test('Anular el Desembolso y el Prestamo de la Persona Juridica', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULACIÓN DE DESEMBOLSO'})).toBeVisible();

        // Digitar el nombre de la empresa
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Debe mostrarse la solicitud desembolsada de la empresa
        const solicitudDesembolsadaEmpresa = page.getByRole('row', {name: `${nombreEmpresa}`});
        await expect(solicitudDesembolsadaEmpresa).toBeVisible();

        // Click al boton de Anular Desembolso
        await solicitudDesembolsadaEmpresa.locator(`${dataCancelar}`).click();

        // Debe aparecer un modal para anular el desembolso
        await expect(modalAnularDesembolso).toBeVisible();

        // No debe mostrarse el desembolso anulado anteriormente
        await expect(page.getByLabel('Anular Desembolso').getByRole('cell', {name: 'RD$ 300,000.00'})).toBeVisible();

        // Seleccionar el desembolso del prestamo
        await page.getByRole('checkbox').last().click();

        // Digitar una razon de la anulacion del desembolso
        await razonAnulacion.fill('Anular el Desembolso y el Prestamo en su totalidad');

        // Click al boton de Anular Desembolso
        const botonAnularDesembolso = page.getByRole('button', {name: 'Préstamo y Desembolso', exact: true});
        await expect(botonAnularDesembolso).toBeVisible();
        await botonAnularDesembolso.click();

        // Debe aparecer un modal de confirmacion
        await expect(page.locator('text=¿Está seguro de cancelar el préstamo?')).toBeVisible();

        // Click al boton de Aceptar
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que el modal se cierre
        await page.waitForTimeout(3000);

        // El modal de Anular Desembolso debe desaparecer
        await expect(modalAnularDesembolso).not.toBeVisible();

        // Aparece una alerta de que se anulo el desembolso
        await expect(page.locator('text=Operacion completada con exito')).toBeVisible();
    });
    
    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
