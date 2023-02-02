import { chromium } from 'playwright';

const dataFilter = async (ICsNumbers, params) => {
    return ICsNumbers.map(async (IC) => {
        return await openIC(IC, params, 0);
    });
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
    const { browser, context, page } = await pageLaunch();
    try {
        const response = await scrapingFile(IC, params, context, page);
        await pageClose(browser, context);

        return response;
    } catch {
        count++;
        await pageClose(browser, context);

        if (count < 3) await openIC(IC, params, count);
        return;
    }
};

async function scrapingFile(IC, params, context, page) {
    const url =
        'http://www3.mte.gov.br/sistemas/mediador/ConsultarInstColetivo';

    await page.goto(url);
    await page.waitForSelector('#linkConsultaBasica');
    await page.locator('#linkConsultaBasica').click();
    await page.waitForSelector('#rdbNRRequerimento');
    await page.locator('#rdbNRRequerimento').click();
    await page.locator('#NRRequerimento').type(IC);

    const newWindowPromise = context.waitForEvent('page');

    await page.locator('#btnPesquisar').click();

    const newWindow = await newWindowPromise;

    await newWindow.waitForLoadState();
    await newWindow.waitForSelector('#tblConteudo');

    const downloadPromise = newWindow.waitForEvent('download');

    await newWindow.locator('#btnResumoVisualizarSalvar').click();

    const download = await downloadPromise;
    const readableContent = await download.createReadStream();

    readableContent?.on('readable', async () => {
        let chunk;

        while (null !== (chunk = readableContent.read())) {
            if (params.searchType === 'all') {
                if (params.keywords.every((word) => chunk.includes(word))) {
                    await download.delete();

                    return IC;
                }
            } else {
                if (params.keywords.some((word) => chunk.includes(word))) {
                    await download.delete();

                    return IC;
                }
            }
        }
    });

    readableContent?.on('end', async () => {
        await download.delete();
    });

    return;
}

export const scrapingFileService = {
    dataFilter,
};
