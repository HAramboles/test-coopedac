import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig } from './utils/dataTests';
import { formatDate } from './utils/fechas';
import { url_registro_persona } from './utils/urls';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre, apellido de la persona fisica
let nombrePersonaFisica: string | null;
let apellidoPersonaFisica: string | null;

// Cedula, nombre, apellido de la persona menor de edad
let nombrePersonaMenorEdad: string | null;
let apellidoPersonaMenorEdad: string | null;

// Cedula, nombre de la persona juridica
let nombrePersonaJuridica: string | null;

// Cedula, nombre, apellido de la persona relacionada
let nombrePersonaRelacionada: string | null;
let apellidoPersonaRelacionada: string | null;

// Cedula, nombre, apellido de la persona casada
let nombrePersonaCasada: string | null;
let apellidoPersonaCasada: string | null;

// Pruebas
test.describe.serial('Pruebas con la Busqueda Avanzada en Registrar Persona', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ir a la pagina
        await page.goto(`${url_base}`);

        // Persona Fisica
        nombrePersonaFisica = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellidoPersonaFisica = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Persona Menor de Edad
        nombrePersonaMenorEdad = await page.evaluate(() => window.localStorage.getItem('nombreMenor'));
        apellidoPersonaMenorEdad = await page.evaluate(() => window.localStorage.getItem('apellidoMenor'));

        // Persona Juridica
        nombrePersonaJuridica = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));

        // Persona Relacionada
        nombrePersonaRelacionada = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellidoPersonaRelacionada = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

        // Persona Casada
        nombrePersonaCasada = await page.evaluate(() => window.localStorage.getItem('nombrePersonaCasada'));
        apellidoPersonaCasada = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaCasada'));
    });

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.TRIVIAL);
    });

    test('Ir a la opcion de Registrar Persona', async () => {
        // SOCIOS
        await page.getByRole('menuitem', {name: 'SOCIOS'}).click();

        // OPERACIONES
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Registrar persona
        await page.getByRole('menuitem', {name: 'Registrar persona'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_registro_persona}`);
    });

    test('Seccion Busqueda Avanzada', async () => {
        // Titulo de la pagina
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

        // Titulo de la seccion Busqueda Avanzada
        const busquedaAvanzada = page.getByText('Búsqueda Avanzada');
        await expect(busquedaAvanzada).toBeVisible();

        // Click a la seccion Busqueda Avanzada
        await busquedaAvanzada.click();
    });

    test('Buscar las Personas Fisicas Mayores de Edad', async () => {
        // Click al selector de Tipo Socio
        await page.getByTitle('TODOS').first().click();
        // Click a la opcion de Fisica
        await page.getByRole('option', {name: 'FISICA'}).click();

        // Digitar como edad minima 18
        const edadMinima = page.locator('#form_EDAD_MINIMA');
        await edadMinima.clear();
        await edadMinima.fill('18');

        // Click al selector de Ejecutivo
        const selectorEjecutivo = page.locator('#form_ID_EJECUTIVO');
        await selectorEjecutivo.click();
        // Buscar el ejecutivo Cliente Inactivo
        await selectorEjecutivo.fill('Cliente Inactivo');

        // Click a la opcion de Cliente Inactivo
        await page.getByRole('option', {name: 'Cliente Inactivo'}).click();

        // Colocar como fecha minima la fecha actual
        await page.locator('#form_FECHA_INSERCION_MINIMA').fill(`${formatDate(new Date())}`);

        // Click al boton de Aplicar Filtro
        await page.getByRole('button', {name: 'Aplicar filtro'}).click();

        // Deben mostrarse en la lista de personas las personas mayores de edad creadas

        // Persona Fisica
        await expect(page.getByRole('cell', {name: `${nombrePersonaFisica} ${apellidoPersonaFisica}`})).toBeVisible();

        // Persona Fisica Relacionada
        await expect(page.getByRole('cell', {name: `${nombrePersonaRelacionada} ${apellidoPersonaRelacionada}`})).toBeVisible();

        // Persona Fisica Casada
        await expect(page.getByRole('cell', {name: `${nombrePersonaCasada} ${apellidoPersonaCasada}`})).toBeVisible();

        // Esperar que se muestren las personas buscadas
        await page.waitForTimeout(6000);
    });

    test('Buscar a la Persona Fisica Menor de Edad', async () => {
        // Digitar como edad minima 1
        const edadMinima = page.locator('#form_EDAD_MINIMA');
        await edadMinima.clear();
        await edadMinima.fill('1');

        // Digitar como edad maxima 18
        const edadMaxima = page.locator('#form_EDAD_MAXIMA');
        await edadMaxima.clear();
        await edadMaxima.fill('18');

        // Click al boton de Aplicar Filtro
        await page.getByRole('button', {name: 'Aplicar filtro'}).click();

        // Debe mostrarse la persona menor de edad creada
        await expect(page.getByRole('cell', {name: `${nombrePersonaMenorEdad} ${apellidoPersonaMenorEdad}`})).toBeVisible();

        // Esperar que se muesre la persona buscada
        await page.waitForTimeout(6000);
    });

    test('Buscar a la Persona Juridica', async () => {
        // Click a la opcion de Restablecer filtros
        await page.getByText('Restablecer filtros').click();

        // Click al selector de Tipo Socio
        await page.getByTitle('TODOS').first().click();
        // Click a la opcion de Fisica
        await page.getByRole('option', {name: 'JURIDICA'}).click();

        // Click al selector de Ejecutivo
        const selectorEjecutivo = page.locator('#form_ID_EJECUTIVO');
        // const selectorEjecutivo = page.getByTitle('Cliente Inactivo');
        await selectorEjecutivo.click();
        // Buscar el ejecutivo Legal
        await selectorEjecutivo.fill('Legal');

        // Click a la opcion de Legal
        await page.getByRole('option', {name: 'LEGAL', exact: true}).click();

        // Click al boton de Aplicar Filtro
        await page.getByRole('button', {name: 'Aplicar filtro'}).click();

        // Debe mostrarse la persona juridica creada
        await expect(page.getByRole('cell', {name: `${nombrePersonaJuridica}`})).toBeVisible();

        // Esperar que se muestre la persona buscada
        await page.waitForTimeout(6000);
    });
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context 
        await context.close();
    });
})