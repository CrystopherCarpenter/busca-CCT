// @ts-nocheck
import { chromium } from 'playwright';

const filterData = async (ICList, params) => {
    return await Promise.all(
        ICList.map(async (IC) => {
            return await openIC(IC, params, 0);
        })
    );

    // const filteredICList = [];

    // for (const IC of ICList) {
    //     const filteredIC = await openIC(IC, params, 0);
    //     filteredICList.push(filteredIC);
    // }

    // return filteredICList;
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

const openIC = async (IC, params, count: number) => {
    try {
        const { browser, context, page } = await pageLaunch();

        const response = await scrapingFile(IC, params, page, context);

        await pageClose(browser, context);

        return response;
    } catch {
        count++;

        if (count <= 3) await openIC(IC, params, count);
        return;
    }
};

const scrapingFile = async (IC, params, page, context) => {
    const url =
        'http://www3.mte.gov.br/sistemas/mediador/ConsultarInstColetivo';

    await page.goto(url);
    await page.waitForLoadState();
    await page.waitForSelector('#linkConsultaBasica');
    await page.locator('#linkConsultaBasica').click();
    await page.waitForLoadState();
    await page.waitForSelector('#rdbNRRequerimento');
    await page.locator('#rdbNRRequerimento').click();
    await page.locator('#NRRequerimento').type(IC);
    const newWindowPromise = context.waitForEvent('page');

    await page.locator('#btnPesquisar').click();

    const newWindow = await newWindowPromise;

    await newWindow.waitForSelector('#btnResumoVisualizarSalvar');

    const downloadPromise = newWindow.waitForEvent('download');

    await newWindow.locator('#btnResumoVisualizarSalvar').click();

    const download = await downloadPromise;

    const readableContent = await download.createReadStream();

    readableContent.on('readable', () => {
        let chunk;
        while (null !== (chunk = readableContent.read())) {
            if (params.searchType === 'all') {
                if (params.keywords.every((word) => chunk.includes(word))) {
                    return IC;
                }
            } else {
                if (params.keywords.some((word) => chunk.includes(word))) {
                    return IC;
                }
            }
        }
    });

    return;
};

export const dataFilteringService = {
    filterData,
};
