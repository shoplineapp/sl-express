module.exports = {
    preMiddlewares: ['* requestLog requestParseURLEncoded requestParseBody'],

    routes: ['GET / PublicController.index'],

    postMiddlewares: []
};
