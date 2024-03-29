import { Browser, BrowserContext, chromium, Cookie, expect, Locator, Page, test } from '@playwright/test';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { userCorrecto, passCorrecto } from './utils/data/usuarios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Botones de Cancelar y Aceptar del modal de confirmacion
let botonCancelar: Locator;
let botonAceptar: Locator;

// Input de la contraseña del usuario
let campoContraseña: Locator;

// Pruebas
test.describe.serial('Pruebas con la Expiracion de la Sesion del Usuario', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Localizar los botones de Cancelar y Aceptar del modal de confirmacion
        botonCancelar = page.getByRole('button', {name: 'Cancelar'});
        botonAceptar = page.getByRole('button', {name: 'Aceptar'});

        // Localizar el campo de la contraseña del usuario
        campoContraseña = page.locator('#form_password');
    });

    test('Eliminar la Cookie con la Sesion del Usuario', async () => {
        const cookies: Cookie[] = (await context.cookies()).filter((cookie) => {
            return cookie.name !== 'fibankingUsername';
        });

        await context.clearCookies();
        await context.addCookies(cookies);
    });

    test('Modal de Aviso de Expiracion de la Sesion', async () => {
        // Debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'CONFIRMAR USUARIO.'})).toBeVisible();

        // Debe mostrar un mensaje de que la sesion ha expirado
        await expect(page.getByText('SU SESIÓN HA EXPIRADO, POR FAVOR INGRESE SU CONTRASEÑA PARA PODER CONTINUAR.')).toBeVisible();

        // Campo de la contraseña debe estar visible
        await expect(campoContraseña).toBeVisible();

        // Los botones de Cancelar y Aceptar deben estar visibles
        await expect(botonCancelar).toBeVisible();
        await expect(botonAceptar).toBeVisible();
    });

    test('Colocar una contraseña incorrecta', async () => {
        // Ingresar una contraseña incorrecta
        await campoContraseña.fill('123456');

        // Experar tres segundos antes de hacer click en el boton de Aceptar
        await page.waitForTimeout(3000);

        // Click en el boton de Aceptar
        await botonAceptar.click();

        // Deberia salir un modal de error
        await expect(page.getByText('Error', {exact: true}).first()).toBeVisible();

        // Mensaje del modal
        await expect(page.getByText('Ocurrió un error al iniciar sesión, por favor verifique sus datos.').first()).toBeVisible();

        // Click al boton de Aceptar del modal de error
        await page.locator('(//BUTTON[@type="button"])[9]').click();

        // El modal de error debe desaparecer
        await expect(page.getByText('Error', {exact: true})).not.toBeVisible();

        //  El modal de confirmacion debe seguir visible
        await expect(page.locator('h1').filter({hasText: 'CONFIRMAR USUARIO.'})).toBeVisible();
    });

    test('Cancelar la operacion', async () => {
        // Click al boton de Cancelar
        await botonCancelar.click();

        // Deberia salir un modal de confirmacion
        await expect(page.locator('text=¿Está seguro que desea perder la sesión?')).toBeVisible();

        // Click al boton de Aceptar del modal de confirmacion
        await page.getByRole('dialog').filter({hasText: 'Confirmar¿Está seguro que desea perder la sesión?CancelarAceptar'}).getByRole('button', {name: 'check Aceptar'}).click();

        // Debe mostrarse otro modal de confirmacion
        await expect(page.locator('text=¿Está seguro que desea perder la sesión?')).toBeVisible();

        // Click al boton de Aceptar del nuevo modal de confirmacion
        await page.getByRole('dialog').filter({hasText: 'Cerrar sesión¿Seguro que deseas cerrar sesión?CancelarAceptar'}).getByRole('button', {name: 'check Aceptar'}).click();

        // Deberia regresar al login
        await expect(page).toHaveURL(`${url_base}/login`);
    });

    test('Ingresar a la pagina nuevamente', async () => {
        // Ingresar el usuario
        await page.locator('#form_username').fill(`${userCorrecto}`);

        // Ingresar la contraseña
        await page.locator('#form_password').fill(`${passCorrecto}`);

        // Click al boton de Iniciar Sesion
        await page.getByRole('button', {name: 'Iniciar Sesión'}).click(); 

        // Deberia ingresar a la pagina de inicio, por lo que la url debe cambiar
        await expect(page).toHaveURL(`${url_base}`);
    });

    test('Eliminar Nuevamente la Cookie con la Sesion del Usuario', async () => {
        const cookies: Cookie[] = (await context.cookies()).filter((cookie) => {
            return cookie.name !== 'fibankingUsername';
        });

        await context.clearCookies();
        await context.addCookies(cookies);
    });

    test('El Modal de Aviso de Expiracion de la Sesion debe mostrarse', async () => {
        // Se debe estar en la pagina de inicio
        await expect(page).toHaveURL(`${url_base}`);
        
        // Recargar la pagina
        await page.reload();

        // Debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'CONFIRMAR USUARIO.'})).toBeVisible();

        // Debe mostrar un mensaje de que la sesion ha expirado
        await expect(page.getByText('SU SESIÓN HA EXPIRADO, POR FAVOR INGRESE SU CONTRASEÑA PARA PODER CONTINUAR.')).toBeVisible();

        // Ingresar la contraseña correcta
        await campoContraseña.fill(`${passCorrecto}`);

        // Click al boton de Aceptar
        await botonAceptar.click();

        // Deberia quedarse en la misma pagina 
        await expect(page).toHaveURL(`${url_base}`);        
    });

    test('Ir a la opcion de Registrar Persona', async () => {
        // Boton de Socios
        await page.getByRole('menuitem', {name: 'SOCIOS'}).click();

        // Boton de Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Boton de Registrar Persona
        await page.getByRole('menuitem', {name: 'Registrar persona'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_registro_persona}`);

        // El titulo de registrar persona debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
