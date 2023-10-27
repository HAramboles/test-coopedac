import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    url_base, 
    browserConfig, 
    contextConfig, 
    formBuscar, 
    userCorrecto, 
    nombreTestigoCajero, 
    razonAnulacion, 
    noData 
} from './utils/dataTests';
import {  url_sesiones_transito, url_cerrar_sesiones_transito } from './utils/urls';
import { servicio_cajas } from './utils/servicios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas Cerrando todas las Sesiones de un usuario', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Dirigirse a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Sesiones en Transito', async () => {
        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // OPERACIONES 
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Sesiones en Transito
        await page.getByRole('menuitem', {name: 'Sesiones en Tránsito'}).click();
        
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_sesiones_transito}`);
    });

    test('Debe mostrarse por lo menos una Sesion en Transito de la Caja en uso', async () => {
        // Digitar el nombre de la caja
        await page.locator(`${formBuscar}`).fill(`${userCorrecto}`);

        // Debe aparecer por lo menos una sesion en transito
        await expect(page.getByRole('cell', {name: `${userCorrecto}`})).toBeVisible();
    });

    test('Ir a la pagina de Cerrar Sesiones en Transito', async () => {
        // Click a contraer todo
        await page.getByText('Contraer todo').click();

        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // OPERACIONES 
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Cerrar Sesiones en Transito
        await page.getByRole('menuitem', {name: 'Cerrar Sesiones en Tránsito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cerrar_sesiones_transito}`);
    });

    test('Cerrar todas las Sesiones en Transito de un Usuario', async () => {
        // Esperar a que el servicio de cajas responda
        await page.waitForResponse(`${servicio_cajas}`);

        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CERRAR SESIONES EN TRÁNSITO'})).toBeVisible();

        // Click al boton de Actualizar
        await page.getByRole('button', {name: 'Actualizar'}).click();

        // Digitar el nombre del usuario/caja
        await page.locator(`${formBuscar}`).fill(`${userCorrecto}`);

        // Boton de Cerrar todas las sesiones
        const botonCerrarSesiones = page.getByRole('button', {name: 'Cerrar todas las sesiones'});
        await expect(botonCerrarSesiones).toBeVisible();    
        await botonCerrarSesiones.click();

        // Debe aparecer un modal para cerrar todas las sesiones
        const modalCerrarSesiones = page.getByText('Cerrar sesiones de usuario');
        await expect(modalCerrarSesiones).toBeVisible();

        // Elegir la caja/usuario
        await page.locator('#form_ID_PERSONAL_ASIGNADO').click();
        // Elegir la caja/usuario en uso
        await page.getByRole('option', {name: `${userCorrecto} - ${nombreTestigoCajero}`}).click();

        // Esperar a que la caja/usuario se seleccione
        await page.waitForTimeout(1000);

        // Digitar una razon del cierre de las sesiones
        await page.locator(`${razonAnulacion}`).fill('Cerrar las sesiones de la caja que quedaron abiertas');

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Aparece un modal para confirmar el cierre de las sesiones
        await expect(page.getByText('¿Deseas cerrar todas las sesiones del usuario?')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).nth(1).click();

        // Aparece un modal de Operacion Exitosa
        await expect(page.getByText('Todas las sesiones han sido cerradas')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).nth(1).click();

        // El modal no debe estar visible
        await expect(modalCerrarSesiones).not.toBeVisible();

        // Las sesiones no deben mostrarse
        await expect(page.getByText(`${noData}`)).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas 
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});

