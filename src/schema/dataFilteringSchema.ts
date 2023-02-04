import Joi from 'joi';

export const dataFilteringSchema = Joi.object({
    ICList: Joi.array().items(Joi.string()).required(),
    params: {
        searchType: Joi.string().required().valid('all', 'any'),
        keywords: Joi.array().items(Joi.string()).required(),
    },
});
