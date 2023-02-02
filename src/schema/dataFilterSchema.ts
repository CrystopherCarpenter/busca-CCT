import Joi from 'joi';

export const dataFilterSchema = Joi.object({
    IC: Joi.string().required(),
    params: {
        searchType: Joi.string().required(),
        keywords: Joi.array().items(Joi.string()).required(),
    },
});
