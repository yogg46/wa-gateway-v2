const { ValidationError } = require('../utils/errors');
const { sendValidationError } = require('../utils/response');

/**
 * Validate request data against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Where to get data from (body, query, params)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});

      return sendValidationError(res, errors, 'Validation failed');
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};