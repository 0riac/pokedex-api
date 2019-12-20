function returnMongooseResponseOrError(res, successStatusCode = 200, specialHandler = null) {
    return (err, data) => {
        if (err) {
            var shouldShowDebug = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'test';
            if (err.name === 'ValidationError') {
                return res.status(500).json(formatValidationError(err));
            }
            return res.status(500).json(
                { message: !shouldShowDebug ? 'Error occurred while handling your request' : err.message }
            );
        } else {
            if (data === null) {
                res.status(404).json('Не найдено');
            } else {
                specialHandler
                    ? specialHandler(data).then(data => res.status(successStatusCode).json(data))
                    : res.status(successStatusCode).json(data);
            }
        }
    };
}

function formatValidationError(data) {

    const errorArray = [];

    for (let key in data.errors) {
        errorArray.push({ ...data.errors[key], type: data.errors[key].name, name: undefined, properties: undefined });
    }

    return errorArray.length > 1 ? errorArray : errorArray[0];
}

function errorHandler(err, req, res, next) {
    console.log(err.name);

    if (err.name === 'ValidationError') {
        res.status(400).json(formatValidationError(err));
    }

    next();
}

module.exports = {
    returnMongooseResponseOrError,
    errorHandler,
};
