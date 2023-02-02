import { Request, Response } from 'express';
import { scrapingPageService, dataFilteringService } from '../service';

export const searchData = async (req: Request, res: Response) => {
    const params = req.body;
    const ICList = await scrapingPageService.getData(params);

    return res.send(ICList);
};

export const filterData = async (req: Request, res: Response) => {
    const { ICList, params } = req.body;
    const filteredICList = await dataFilteringService.filterData(
        ICList,
        params
    );

    return res.send(filteredICList);
};
