import { Router } from 'express';
import httpStatus from 'http-status';
import { searchData } from '../controller';
import { validateBody } from '../middlewares';
import { searchParamsSchema } from '../schema';
// import { authentication } from '../middlewares';

const scrapingPageRouter = Router();

scrapingPageRouter.get('/', validateBody(searchParamsSchema), searchData);

export { scrapingPageRouter };
