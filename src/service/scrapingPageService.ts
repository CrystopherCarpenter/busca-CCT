// @ts-nocheck
import { chromium } from 'playwright';
import { load } from 'cheerio';
import * as fs from 'fs';

const getData = async (params) => {
    return await getIC(params, 0);
};

const pageLaunch = async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    return { browser, context, page };
};
const pageClose = async (browser, context) => {
    await context.close();
    await browser.close();

    return;
};

const getIC = async (params, count: number) => {
    const { browser, context, page } = await pageLaunch();

    try {
        await searchIC(params, page, context);
        const response = await getICNumbers(page);
        await pageClose(browser, context);

        return response;
    } catch {
        count++;
        await pageClose(browser, context);

        if (count <= 3) await getIC(params, count);
        return;
    }
};

const searchIC = async (params, page, context) => {
    const url =
        'http://www3.mte.gov.br/sistemas/mediador/ConsultarInstColetivo';

    await page.goto(url);
    await page.waitForSelector('#chkNRCNPJ');

    await searchParams(params, page, context);

    await page.locator('#btnPesquisar').click();
    await page.waitForSelector('#btnExportar', { timeout: 30000 });

    return;
};

const searchParams = async (params, page, context) => {
    await page.locator('#cboSTVigencia').selectOption(params.validity);

    if (params.type) {
        await page.locator('#cboTPRequerimento').selectOption(params.type);
    }
    if (params.partSearch) {
        await page.locator(`#chk${params.partSearch.type}`).click();
        await page
            .locator(`#txt${params.partSearch.type}`)
            .type(params.partSearch.code);
    }
    if (params.category) {
        await page.locator('#chkCategoria').click();
        await page.locator('#txtDSCategoria').type(params.category);
    }
    if (params.stateRegistry) {
        await page.locator('#cboUFRegistro').selectOption(params.stateRegistry);
    }
    if (params.dateSearch) {
        await page
            .locator(
                `#chk${params.dateSearch.type === 'Registro' ? `Periodo` : ''}${
                    params.dateSearch.type
                }`
            )
            .click();
        await page
            .locator(`#txtDTInicio${params.dateSearch.type}`)
            .type(params.dateSearch.startDate);
        await page
            .locator(`txtDTFim${params.dateSearch.type}`)
            .type(params.dateSearch.endDate);
    }
    if (params.coverage) {
        for (const type of params.coverage.type) {
            await page.locator(`#chk${type}`).click();
        }
        for (const state of params.coverage.state) {
            await page
                .locator('#cboUFAbrangenciaTerritorial')
                .selectOption(state);
            await page.locator('#btnAdicionarUF').click();
        }
        for (const { state, city } of params.coverage.cities) {
            await page
                .locator('#cboUFAbrangenciaTerritorial')
                .selectOption(state);
            const popUpPromise = context.waitForEvent('page');
            await page.locator('#btnSelecionarMunicipio').click();
            const popUp = await popUpPromise;
            await popUp.waitForLoadState();
            await popUp.getByText(city[0], { exact: true }).click();
            await popUp.getByText(city, { exact: true }).click();
            await popUp.getByText('Fechar', { exact: true }).click();
        }
    }
    if (params.basicSearch) {
        await page.locator('#linkConsultaBasica').click();
        await page.locator(`#rdbNR${params.basicSearch.type}`).click();
        await page
            .locator(`#NR${params.basicSearch.type}`)
            .type(params.basicSearch.code);
    }

    return;
};

const getICNumbers = async (page) => {
    const downloadPromise = page.waitForEvent('download');

    await page.locator('#btnExportar').click();

    const download = await downloadPromise;

    await download.saveAs('./ict.html');

    const $ = load(fs.readFileSync('./ict.html'));
    const ICNumbers = $('.BgClaro')
        .map(function () {
            if ($(this).html()?.includes('MR0')) return $(this).html();
        })
        .toArray();

    fs.unlink('./ict.html', function (err) {
        if (err) throw err;
    });

    await download.delete();

    return ICNumbers;
};

export const scrapingPageService = {
    getData,
};
