import { Router } from 'express';
import httpStatus from 'http-status';
import { getData } from '../controller';
// import { authentication } from '../middlewares';

const scrappingRouter = Router();

scrappingRouter.get('/', getData).get('/*', () => {
    throw httpStatus.NOT_FOUND;
});

export { scrappingRouter };
