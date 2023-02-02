import { Request, Response } from 'express';
import { scrapingPageService, scrapingFileService } from '../service';

export const getData = async (req: Request, res: Response) => {
    const params = req.body;
    const ICList = await scrapingPageService.getData(params);

    return res.send(ICList);
};

export const filterData = async (req: Request, res: Response) => {
    const { IC, params } = req.body;
    const ICList = await scrapingFileService.dataFilter(IC, params);

    return res.send(ICList);
};
