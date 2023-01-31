import { chromium } from 'playwright';
import { load } from 'cheerio';
import * as fs from 'fs';

const getData = async (params) => {
    return await getIC(params, 0);
};

const getIC = async (params, count: number) => {
    try {
        return await searchIC(params);
    } catch {
        count++;
        console.log(count);
        if (count < 3) await getIC(params, count);
        return;
    }
};

const searchIC = async (params) => {
    const CNPJ = '69207850000161';
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(
        'http://www3.mte.gov.br/sistemas/mediador/ConsultarInstColetivo'
    );

    await page.waitForSelector('#chkNRCNPJ');

    await searchParams(params, page, context);

    await page.locator('#btnPesquisar').click();
    await page.waitForSelector('#btnExportar', { timeout: 30000 });

    const downloadPromise = page.waitForEvent('download');

    await page.locator('#btnExportar').click();

    const download = await downloadPromise;

    await download.saveAs('./ict.html');

    const $ = load(fs.readFileSync('./ict.html'));

    const listSolicitacao = $('.BgClaro')
        .map(function () {
            if ($(this).html()?.includes('MR0')) return $(this).html();
        })
        .toArray();

    console.log(listSolicitacao);

    for (const solicitacao of listSolicitacao) {
        await readFile(solicitacao, 0);
    }

    fs.unlink('./ict.html', function (err) {
        if (err) throw err;
    });
    await download.delete();
    await context.close();
    await browser.close();
    return;
};

async function searchParams(params, page, context) {
    await page.locator('#').selectOption(params.Tipo_Instrumento);

    await page.locator('#cboSTVigencia').selectOption(params.Vigencia);

    if (params.baseSearch) {
        await page.locator(`#chk${params.baseSearch.type}`).click();
        await page
            .locator(`#txt${params.baseSearch.type}`)
            .type(params.baseSearch.code);
    }
    if (params.categoria) {
        await page.locator('#').click();
        await page.locator('#').type(params.Categoria);
    }
    if (params.UFRegistro) {
        await page.locator('#').selectOption(params.UF_Registro);
    }
    if (params.dateSearch) {
        await page.locator(`#chk${params.dateSearch.type}`).click();
        await page
            .locator(params.dateSearch.type)
            .type(params.dateSearch.startDate);
        await page
            .locator(params.dateSearch.type)
            .type(params.dateSearch.endDate);
    }
    if (params.abrangencia) {
        for (const type of params.abrangencia.type) {
            await page.locator(`#chk${type}`).click();
        }
        for (const UF of params.abrangencia.UF) {
            await page.locator('#').selectOption(UF);
        }
        for (const { UF, municipio } of params.abrangencia.municipios) {
            await page.locator('#').selectOption(UF);
            const popUpPromise = context.waitForEvent('page');
            await page.locator('#').click();
            const popUp = await popUpPromise;
            await popUp.waitForLoadState();
            await popUp.getByText(municipio[0], { exact: true }).click();
            await popUp.getByText(municipio, { exact: true }).click();
            await popUp.locator('').click();
        }
    }
    if (params.basicSearch) {
        await page.locator('#').click();
        await page.locator(`#${params.basicSearch.type}`).click();
        await page.locator('#').type(params.basicSearch.code);
    }
    return;
}

async function readFile(solicitacao, count) {
    const word1 = 'motorista';
    try {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(
            'http://www3.mte.gov.br/sistemas/mediador/ConsultarInstColetivo'
        );

        await page.waitForSelector('#linkConsultaBasica');
        await page.locator('#linkConsultaBasica').click();

        await page.waitForSelector('#rdbNRRequerimento');

        await page.locator('#rdbNRRequerimento').click();
        await page.locator('#NRRequerimento').type(solicitacao);

        const newWindowPromise = context.waitForEvent('page');

        await page.locator('#btnPesquisar').click();

        const newWindow = await newWindowPromise;

        await newWindow.waitForLoadState();

        await newWindow.waitForSelector('#tblConteudo');

        const downloadPromise = newWindow.waitForEvent('download');

        await newWindow.locator('#btnResumoVisualizarSalvar').click();

        const download = await downloadPromise;

        const readableContent = await download.createReadStream();

        readableContent?.on('readable', () => {
            let chunk;

            while (null !== (chunk = readableContent.read())) {
                chunk.includes(word1) &&
                    console.log(`NrSolicitação: ${solicitacao}`);
            }
        });
        readableContent?.on('end', async () => {
            console.log('Reached end of stream.');
            await download.delete();
            await context.close();
            await browser.close();
        });
    } catch {
        count++;
        console.log(count);

        count < 3 && (await readFile(solicitacao, count));
        return;
    }
    return;
}

const service = {
    getData,
};

export default service;
