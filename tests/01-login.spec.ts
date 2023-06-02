import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base, userCorrecto, passCorrecto } from './utils/dataTests';

/* Variables globales */

let browser: Browser;
let context: BrowserContext;
let page: Page;

/* Inputs para ingresar el usuario y la contraseña */

let usernameCampo: Locator;
let passCampo: Locator;

/* Usuario y contraseña */
const user:string = 'hector';
const pass:string = 'abc';

/* Pruebas */

test.describe('Pruebas con el Login de Coopedac', () => {
    test.beforeAll(async () => { /* Antes de las pruebas */
        /* Crear el browser, en este caso el chromiun, con la propiedad headless. Se ejecuta en segundo plano */
        browser = await chromium.launch({
            headless: false,
        });

        /* Crear un context */
        context = await browser.newContext();

        /* Crear una nueva page usando el context */
        page = await context.newPage();

        /* Ingresar a la pagina */
        await page.goto(`${url_base}`);

        /* Localizar los campos para ingresar el usuario y la contraseña */
        usernameCampo = page.locator('#form_username');
        passCampo = page.locator('#form_password');
    });

    test('Los campos deben estar visibles o deben de existir', async () => {
        await expect(page.locator('#form_username')).toBeVisible(); /* Campo de usuario */
        await expect(page.locator('#form_password')).toBeVisible(); /* Campo de contraseña */
        await expect(page.locator('button:has-text("Iniciar Sesión")')).toBeVisible(); /* Boton de Login */
    });

    test('Debe de redigirse al login si el usuario cambia la url', async () => {
        /* Esperar a que el usuario cambie la url manualmente */
        await page.goto(`${url_base}/home`);

        /* Esperar que la url contenga la url correcta, que en este caso es la url_base mas el login */
        await expect(page).toHaveURL(/\/login/);
    });

    test('Debe de dar error al ingresar un usuario y una contraseña incorrectos', async () => {
        /* Ingresar un usuario y una contraseña */
        /* ? = si la variable esta undefined, para ahorrarse el tener que hacer un if */
        await usernameCampo?.fill(user);
        await passCampo?.fill(pass);

        /* Dar click al boton de Login que se llama Iniciar Sesión */
        const buttonLogin = page.getByRole('button', {name: 'Iniciar Sesión'}); /* Const con el boton de login */
        await buttonLogin.click();

        /* La url no debe de cambiar */
        await expect(page).toHaveURL(/\/login/);

        /* Esperar que aparezca un mensaje de error */
        await expect(page.locator('text=Ocurrió un error al iniciar sesión, por favor verifique sus datos.')).toBeVisible();

        /* Dar click al boton de aceptar que aparece en el mensaje de error */
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test('El login debe ser exitoso y se debe mandar al usuario a la pagina de inicio', async () => {
        test.slow();
        
        /* Ingresar un usuario y una contraseña correctos */
        await usernameCampo?.fill(`${userCorrecto}`);
        await passCampo?.fill(`${passCorrecto}`);

        /* Dar click al boton de Iniciar Sesión */
        const buttonLogin = page.getByRole('button', {name: 'Iniciar Sesión'});
        await buttonLogin.click();

        /* Esperar que la url cambie al momento de hacer el login */
        await expect(page).toHaveURL(`${url_base}/home`);

        /* Esperar que el boton de perfil este visible */
        await expect(page.locator('[aria-label="user"]')).toBeVisible();
    });

    test.afterAll(async () => { /* Despues de que se realizen todas las pruebas */
        /* Guardar las cookies y el sesionStorage */
        await context.storageState({path: 'state.json'});

        // Cerrar la page
        await page.close();

        /* Cerrar el context, el browser y guardar el video */
        await context.close();
    });
});