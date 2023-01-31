import { Request, Response } from 'express';
import service from '../service';

export const getData = async (req: Request, res: Response) => {
    const params = req.body;

    const ICList = await service.getData(params);
    return res.send(ICList);
};
