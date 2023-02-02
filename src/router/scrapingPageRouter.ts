import { Router } from 'express';
import httpStatus from 'http-status';
import { searchData } from '../controller';
// import { authentication } from '../middlewares';

const scrapingPageRouter = Router();

scrapingPageRouter.get('/', searchData);

export { scrapingPageRouter };
