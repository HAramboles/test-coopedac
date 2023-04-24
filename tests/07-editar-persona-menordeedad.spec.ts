import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { numerosCorreo } from './utils/cedulasypasaporte';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Correo Menor
const numerosParaCorreoMenor = numerosCorreo;

// Pruebas

test.describe('Editar la Cuenta de un Menor - Agregarle un correo', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context =  await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const actualizarContinuar = async () => {
        // continuar
        const botonContinuar = page.locator('button:has-text("Actualizar y continuar")');
        // presionar el boton
        await botonContinuar.click();
    };

    test('Ir a la opcion de Registro de Persona', async () => {
        // Socios
        await page.getByRole('menuitem', {name: 'SOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Registrar persona
        await page.getByRole('menuitem', {name: 'Registrar persona'}).click();

        // La URL deba cambiar
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);
    });

    test('Buscar la cuenta del menor', async () => {
        // Cedula, nombre y apellido del menor
        const cedulaMenor = await page.evaluate(() => window.localStorage.getItem('cedulaMenor'));
        const nombreMenor = await page.evaluate(() => window.localStorage.getItem('nombreMenor'));
        const apellidoMenor = await page.evaluate(() => window.localStorage.getItem('apellidoMenor'));

        // Buscar al menor
        await page.locator('#form_search').fill(`${cedulaMenor}`);
        
        // Click al boton de editar cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombreMenor} ${apellidoMenor}`}).getByRole('button', {name: 'edit'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/edit/);
    });

    test('Ir a la opcion de Direcciones, telefonos y redes sociales', async () => {
        // El titulo de la primera seccion se debe cambiar
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Seccion de direcciones y contactos
        const direccionesConstantes = page.locator('text=Direcciones y Contactos');
        await expect(direccionesConstantes).toBeVisible();
        await direccionesConstantes.click();
    });

    test('Agregar un email al menor', async () => {
        // Nombre del menor
        const nombreMenor = await page.evaluate(() => window.localStorage.getItem('nombreMenor'));

        // El titulo de emails / redes sociales debe estar visible
        await expect(page.locator('h1').filter({ hasText: 'EMAILS / REDES SOCIALES' })).toBeVisible();

        // Boton agregar email/red social
        const botonEmailRedSocial = page.locator('text=Agregar email/red social');
        await expect(botonEmailRedSocial).toBeVisible();
        await botonEmailRedSocial.click();

        // Debe de aprecer un menu de opciones al hacer click al boton
        await page.getByRole('menuitem', {name: 'EMAIL'}).getByText('EMAIL').click();

        // Input de la descripcion del email
        const campoNombreEmail = page.getByPlaceholder('USUARIO');
        await campoNombreEmail.click();
        await campoNombreEmail?.fill(`correo${numerosParaCorreoMenor}`);
        // Split = dividir el string en subcadenas, lo que lo convierte en un array y con el Join se quita el espacio en blanco

        // Seleccionar un dominio del email
        const campoDominioEmail = page.locator('#form_DOMAIN');
        await campoDominioEmail.click();
        // Ingresar un dominio de email
        await campoDominioEmail.fill('@GMAIL.COM');

        // Hacer click al icono de guardar email
        await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

        // Click en Actualizar y continuar
        actualizarContinuar();
    });

    test('Finalizar con la Edicion de la Cuenta del menor', async () => {
        // Titulo de la ultima seccion
        await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

        // Hacer click al boton de finalizar
        const botonFinalizar = page.locator('text=Finalizar');
        // Esperar que se abran tres pestañas con los diferentes reportes
        const [newPage, newPage2, newPage3] = await Promise.all([
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonFinalizar).toBeVisible(),
            await botonFinalizar.click()
        ]);
        
        // Cerrar las paginas con los reportes
        await newPage.close();
        await newPage2.close();
        await newPage3.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})