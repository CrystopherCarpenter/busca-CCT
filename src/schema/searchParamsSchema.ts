const Joi = require('joi').extend(require('@joi/date'));

export const searchParamsSchema = Joi.object({
    partSearch: { type: Joi.string(), code: Joi.string() },
    categoria: Joi.string(),
    tipo: Joi.string().required(),
    vigencia: Joi.string().required(),
    UFRegistro: Joi.string(),
    dateSearch: {
        type: Joi.string(),
        startDate: Joi.date().format('DD-MM-YYYY'),
        endDate: Joi.date().format('DD-MM-YYYY'),
    },
    abrangencia: {
        type: Joi.array().items(Joi.string()),
        UF: Joi.array().items(Joi.string()),
        Municipios: Joi.array().items({
            UF: Joi.string(),
            municipio: Joi.string(),
        }),
    },
    basicSearch: { type: Joi.string(), code: Joi.string() },
});
