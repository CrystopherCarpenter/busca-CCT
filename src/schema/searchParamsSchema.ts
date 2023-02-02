const Joi = require('joi').extend(require('@joi/date'));

export const searchParamsSchema = Joi.object({
    type: Joi.string(),
    validity: Joi.string().required(),
    partSearch: { type: Joi.string(), code: Joi.string() },
    category: Joi.string(),
    stateRegistry: Joi.string(),
    dateSearch: {
        type: Joi.string(),
        startDate: Joi.date().format('DD-MM-YYYY'),
        endDate: Joi.date().format('DD-MM-YYYY'),
    },
    coverage: {
        type: Joi.array().items(Joi.string()),
        state: Joi.array().items(Joi.string()),
        cities: Joi.array().items({
            state: Joi.string(),
            city: Joi.string(),
        }),
    },
    basicSearch: { type: Joi.string(), code: Joi.string() },
});
