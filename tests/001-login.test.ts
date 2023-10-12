import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base, userCorrecto, passCorrecto, browserConfig, dataVer } from './utils/dataTests';
import { formatDate } from './utils/fechas';

/* Variables globales */
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Inputs del usuario y la contraseña. Y el boton de login
let usernameCampo: Locator;
let passCampo: Locator;
let botonLogin: Locator;

// Usuario y contraseña erroneos 
const user:string = 'hector';
const pass:string = 'abc';

// Pruebas 
test.describe.serial('Pruebas con el Login de Coopedac', async () => {
    test.beforeAll(async () => { /* Antes de las pruebas */
        /* Crear el browser, en este caso el chromiun */
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        /* Crear un context */
        context = await browser.newContext();

        /* Crear una nueva page usando el context */
        page = await context.newPage();

        /* Ingresar a la pagina */
        await page.goto(`${url_base}`);

        /* Localizar los campos para ingresar el usuario y la contraseña y el boton de login */
        usernameCampo = page.locator('#form_username');
        passCampo = page.locator('#form_password');
        botonLogin = page.getByRole('button', {name: 'Iniciar Sesión'});
    });

    test('Los campos deben estar visibles o deben de existir', async () => {
        await expect(usernameCampo).toBeVisible(); /* Campo de usuario */
        await usernameCampo.click();

        await expect(passCampo).toBeVisible(); /* Campo de contraseña */
        await passCampo.click(); 

        await expect(botonLogin).toBeVisible(); /* Boton de Login */
    });

    test('Debe mostar dos mensajes de advertencia si no se ingresan los datos', async () => {
        // Click al boton de login
        await botonLogin.click();

        // Mensaje de que que campo de usuario es requerido
        await expect(page.locator('text=El campo Usuario es requerido')).toBeVisible();

        // Mensaje de que el campo de contraseña es requerido
        await expect(page.locator('text=El campo Contraseña es requerido')).toBeVisible();

        // Presionar la tecla F5
        await page.keyboard.press('F5'); // No debe hacer nada

        // Recargar la pagina   
        await page.reload();

        // La URL debe de ser la misma
        await expect(page).toHaveURL(/\/login/);
    });

    test('Debe de redigirse al login si el usuario cambia la url', async () => {
        /* Esperar a que el usuario cambie la url manualmente */
        await page.goto(`${url_base}/home`);

        // La URL debe cambiarse por la del login
        await expect(page).toHaveURL(/\/login/);

        // Modificar nuevamente la URL
        await page.goto(`${url_base}/crear_cuentas`);

        // La URL debe cambiarse por la del login
        await expect(page).toHaveURL(/\/login/);
    });

    test('Debe de dar error al ingresar un usuario y una contraseña incorrectos', async () => {
        /* Ingresar un usuario y una contraseña */
        /* ? = si la variable esta undefined, para ahorrarse el tener que hacer un if */
        await usernameCampo?.fill(user);
        await passCampo?.fill(pass);

        // El campo de usuario debe de tener el valor que se ingreso
        await expect(usernameCampo).toHaveValue(user);

        // Ver la contraseña que se ingreso haciendo click al boton de ver contraseña
        const botonVerPass = page.locator('[data-icon="eye-invisible"]');
        await expect(botonVerPass).toBeVisible();
        await botonVerPass.click();

        // El campo de contraseña debe de tener el valor que se ingreso
        await expect(passCampo).toHaveValue(pass);

        // Ocultar la contraseña
        const botonOcultarPass = page.locator(`${dataVer}`);
        await expect(botonOcultarPass).toBeVisible();
        await botonOcultarPass.click();

        /* Dar click al boton de Login */
        await botonLogin.click();

        /* La url no debe de cambiar */
        await expect(page).toHaveURL(/\/login/);

        // Titulo del modal del error
        await expect(page.getByText('Error', {exact: true})).toBeVisible();

        /* Esperar que aparezca un mensaje de error */
        await expect(page.locator('text=Ocurrió un error al iniciar sesión, por favor verifique sus datos.')).toBeVisible();

        /* Dar click al boton de aceptar que aparece en el mensaje de error */
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();
    });

    test('El login debe ser exitoso y se debe mandar al usuario a la pagina', async () => {
        /* Ingresar un usuario y una contraseña correctos */
        await usernameCampo.clear();
        await usernameCampo?.fill(`${userCorrecto}`);
        await passCampo?.fill(`${passCorrecto}`);

        // El campo de usuario debe de tener el valor que se ingreso
        await expect(usernameCampo).toHaveValue(`${userCorrecto}`);

        /* Dar click al boton de Iniciar Sesión */
        await botonLogin.click();

        // Esperar que la url cambie al momento de hacer el login, todavia con la URL que se ingreso manualmente
        await expect(page).toHaveURL(`${url_base}/crear_cuentas`);

        /* Esperar que el boton de perfil este visible */
        await expect(page.locator('[aria-label="user"]')).toBeVisible();

        // El nombre de usuario debe estar visible
        await expect(page.getByRole('paragraph').filter({hasText: `${userCorrecto}`})).toBeVisible();
    });

    test('La pagina en la que esta el usuario debe ser una 404 por la URL erronea', async () => {
        // Pagina no encontrada
        await expect(page.getByText('404')).toBeVisible();
        await expect(page.locator('text=Página no encontrada')).toBeVisible();
    });

    test('Ir a la Home Page', async () => {
        // Boton de ir al inicio
        const botonIrInicio = page.getByRole('button', {name: 'Ir a inicio'});
        await expect(botonIrInicio).toBeVisible();
        await botonIrInicio.click();

        // Debe de redirigir al usuario al inicio
        await expect(page).toHaveURL(`${url_base}`);
    });

    test('La Fecha del Dia debe estar visible', async () => {
        // Fecha del dia actual en el Header
        await expect(page.getByText(`${formatDate(new Date())}`)).toBeVisible();
    });

    test('Menu de Navegacion de la pagina', async () => {
        // Las opciones del menu de navegacion deben de estar visibles
        await expect(page.getByRole('menuitem', {name: 'SOCIOS'})).toBeVisible();
        await expect(page.getByRole('menuitem', {name: 'CAPTACIONES'})).toBeVisible();
        await expect(page.getByRole('menuitem', {name: 'NEGOCIOS'})).toBeVisible();
        await expect(page.getByRole('menuitem', {name: 'TESORERIA'})).toBeVisible();
        await expect(page.getByRole('menuitem', {name: 'CONTABILIDAD'})).toBeVisible();
        await expect(page.getByRole('menuitem', {name: 'CONFIGURACION'})).toBeVisible();
        await expect(page.getByRole('menuitem', {name: 'REPORTES BIRT'})).toBeVisible();
    });

    test.afterAll(async () => { /* Despues de que se realizen todas las pruebas */
        /* Guardar las cookies y el sesionStorage en el state */
        await context.storageState({path: 'state.json'});

        // Cerrar la page
        await page.close();

        /* Cerrar el context */
        await context.close();
    });
});