// @ts-nocheck
import { chromium } from 'playwright';

const filterData = async (ICList, params) => {
    return await Promise.all(
        ICList.map(async (IC) => {
            return await scrapingFile(IC, params);
        })
    );
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

const scrapingFile = async (IC, params) => {
    const { browser, context, page } = await pageLaunch();
    const newWindow = await accessFile(IC, page, context, 0);
    const downloadPromise = newWindow.waitForEvent('download');

    await newWindow.locator('#btnResumoVisualizarSalvar').click();

    const download = await downloadPromise;
    const readableContent = await download.createReadStream();
    let response;

    const filterStream = (readableStream) => {
        return new Promise((resolve, reject) => {
            readableStream
                ?.on('readable', () => {
                    let chunk;
                    while (null !== (chunk = readableStream.read())) {
                        if (params.searchType === 'all') {
                            if (
                                params.keywords.every((word) =>
                                    chunk.includes(word)
                                )
                            ) {
                                response = IC;
                                readableStream.destroy();
                            }
                        } else {
                            if (
                                params.keywords.some((word) =>
                                    chunk.includes(word)
                                )
                            ) {
                                response = IC;
                                readableStream.destroy();
                            }
                        }
                    }
                })
                .on('close', resolve)
                .on('end', resolve)
                .on('error', reject);
        });
    };

    try {
        await filterStream(readableContent);
        await pageClose(browser, context);

        return response;
    } catch (err) {
        throw err;
    }
};

const accessFile = async (IC, page, context, count) => {
    try {
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
        return newWindow;
    } catch {
        count++;
        if (count < 3) return await accessFile(IC, page, context, count);
    }
};

export const dataFilteringService = {
    filterData,
};
