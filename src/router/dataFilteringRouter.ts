import { Router } from 'express';
import httpStatus from 'http-status';
import { filterData } from '../controller';
import { validateBody } from '../middlewares';
import { dataFilteringSchema } from '../schema/dataFilteringSchema';
// import { authentication } from '../middlewares';

const dataFilteringRouter = Router();

dataFilteringRouter.get('/', validateBody(dataFilteringSchema), filterData);

export { dataFilteringRouter };
