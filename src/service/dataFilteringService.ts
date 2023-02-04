import http from 'http';

const filterData = async (ICList: string[], params: any) => {
    return await Promise.all(
        ICList.map(async (IC: string) => {
            return await scrapingFile(IC, params);
        })
    );
};

const scrapingFile = async (IC: string, params: any) => {
    const url = `http://www3.mte.gov.br/sistemas/mediador/Resumo/ResumoVisualizar?NrSolicitacao=${IC}`;
    let response;

    const filterStream = () => {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                if (res.statusCode !== 200) {
                    throw res.statusCode;
                }
                res.on('data', (chunk) => {
                    if (params.searchType === 'all') {
                        if (
                            params.keywords.every((word: string) =>
                                chunk
                                    .toString()
                                    .toLowerCase()
                                    .includes(word.toLowerCase())
                            )
                        ) {
                            response = IC;
                            res.destroy();
                        }
                    } else {
                        if (
                            params.keywords.some((word: string) =>
                                chunk
                                    .toString()
                                    .toLowerCase()
                                    .includes(word.toLowerCase())
                            )
                        ) {
                            response = IC;
                            res.destroy();
                        }
                    }
                })
                    .on('close', resolve)
                    .on('end', resolve)
                    .on('error', reject);
            });
        });
    };

    try {
        await filterStream();
        return response;
    } catch (err) {
        throw err;
    }
};

export const dataFilteringService = {
    filterData,
};
