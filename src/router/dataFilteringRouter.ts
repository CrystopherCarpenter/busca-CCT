import { Router } from 'express';
import httpStatus from 'http-status';
import { filterData } from '../controller';
// import { authentication } from '../middlewares';

const dataFilteringRouter = Router();

dataFilteringRouter.get('/', filterData);

export { dataFilteringRouter };
