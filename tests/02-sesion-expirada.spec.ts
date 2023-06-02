import { Browser, BrowserContext, chromium, Cookie, expect, Page, test } from '@playwright/test';
import { url_base, passCorrecto } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas

test.describe('Pruebas con la Expiracion de la Sesion del Usuario', () => {
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
    });

    test('Ir a la opcion de Registro de Persona', async () => {
        // SOCIOS
        await page.getByRole('menuitem', {name: 'SOCIOS'}).click();

        // OPERACIONES
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Registro persona
        await page.getByRole('menuitem', {name: 'Registrar persona'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);
    });

    test('Eliminar la Cookie con la Sesion del Usuario', async () => {
        /*
            Funcionamiento: primero filtra las cookies que sean diferentes del nombre elegido de la cookie,
            entonces se eliminan todas las cookies y agregan las cookies nuevamente pero con el filtro
            aplicado.
        */

        const cookies: Cookie[] = (await context.cookies()).filter((cookie) => {
            return cookie.name !== 'fibankingUsername';
        });

        await context.clearCookies();
        await context.addCookies(cookies);
    });

    test('Se debe pedir la contraseña del usuario', async () => {
        test.slow();

        // Debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'CONFIRMAR USUARIO.'})).toBeVisible();

        // Debe mostrar un mensaje de que la sesion ha expirado
        await expect(page.getByText('SU SESIÓN HA EXPIRADO, POR FAVOR INGRESE SU CONTRASEÑA PARA PODER CONTINUAR.')).toBeVisible();

        // Colocar la contraseña del usuario
        await page.locator('#form_password').fill(`${passCorrecto}`);

        // Debe quedarse en la misma seccion
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);

        // El titulo de la seccion debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
