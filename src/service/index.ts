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

    const solicitacaoList = $('.BgClaro')
        .map(function () {
            if ($(this).html()?.includes('MR0')) return $(this).html();
        })
        .toArray();

    fs.unlink('./ict.html', function (err) {
        if (err) throw err;
    });
    await download.delete();
    await context.close();
    await browser.close();

    return solicitacaoList;
};

const searchParams = async (params, page, context) => {
    await page
        .locator('#cboTPRequerimento')
        .selectOption(params.Tipo_Instrumento);

    await page.locator('#cboSTVigencia').selectOption(params.Vigencia);

    if (params.partSearch) {
        await page.locator(`#chk${params.baseSearch.type}`).click();
        await page
            .locator(`#txt${params.baseSearch.type}`)
            .type(params.baseSearch.code);
    }
    if (params.categoria) {
        await page.locator('#chkCategoria').click();
        await page.locator('#txtDSCategoria').type(params.Categoria);
    }
    if (params.UFRegistro) {
        await page.locator('#cboUFRegistro').selectOption(params.UF_Registro);
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
    if (params.abrangencia) {
        for (const type of params.abrangencia.type) {
            await page.locator(`#chk${type}`).click();
        }
        for (const UF of params.abrangencia.UF) {
            await page.locator('#cboUFAbrangenciaTerritorial').selectOption(UF);
            await page.locator('#btnAdicionarUF').click();
        }
        for (const { UF, municipio } of params.abrangencia.municipios) {
            await page.locator('#cboUFAbrangenciaTerritorial').selectOption(UF);
            const popUpPromise = context.waitForEvent('page');
            await page.locator('#btnSelecionarMunicipio').click();
            const popUp = await popUpPromise;
            await popUp.waitForLoadState();
            await popUp.getByText(municipio[0], { exact: true }).click();
            await popUp.getByText(municipio, { exact: true }).click();
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

const readSolicitacao = async (solicitacaoList, keywordsSearch) => {
    for (const solicitacao of solicitacaoList) {
        await scrapingFile(solicitacao, keywordsSearch, 0);
    }
};

async function scrapingFile(
    solicitacao: string,
    keywordsSearch,
    count: number
) {
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

        const matches: string[] = [];

        readableContent?.on('readable', () => {
            let chunk;

            while (null !== (chunk = readableContent.read())) {
                if (keywordsSearch.type === 'all') {
                    if (
                        keywordsSearch.keywords.every((word) =>
                            chunk.includes(word)
                        )
                    ) {
                        matches.push(solicitacao);
                    }
                } else {
                    if (
                        keywordsSearch.keywords.some((word) =>
                            chunk.includes(word)
                        )
                    ) {
                        matches.push(solicitacao);
                    }
                }
            }
        });
        readableContent?.on('end', async () => {
            await download.delete();
            await context.close();
            await browser.close();
        });
        return;
    } catch {
        count++;
        count < 3 && (await scrapingFile(solicitacao, keywordsSearch, count));
        return;
    }
}

const service = {
    getData,
};

export default service;
