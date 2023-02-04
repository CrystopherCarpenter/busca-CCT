import express, { Express } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { handleApplicationErrors } from './middlewares';
import { loadEnv, connectDb, disconnectDB } from './config';
import { scrapingPageRouter, dataFilteringRouter } from './router';
var morgan = require('morgan');

loadEnv();

const app = express();
app.all('/*', morgan('dev'))
    .use(cors())
    .use(express.json())
    .use('/scrap', scrapingPageRouter)
    .use('/filter', dataFilteringRouter)
    .use(handleApplicationErrors);

export const init = (): Promise<Express> => {
    connectDb();
    return Promise.resolve(app);
};

export const close = async (): Promise<void> => {
    await disconnectDB();
};

export default app;
