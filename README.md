# Amn Express

In the first instance, `amn` is the wrapper I developed for myself to work with [express](https://expressjs.com/). As long as I go further, the functionality of amn grows and evolve. Onwards I equip all my back-end services with `amn` as it helps to simplify the architecture, write less code, and boost productivity.

> Why amn? I pick the name of the city from the great video game Baldur's Gate II: Shadows of Amn.

### General description

`Amn` provides the following capabilities:

-   [Response middleware](#response-middleware). Centralize and simplify your response flow, `res.send` call handles by `amn` in a single place.
-   [Request helpers](#request-helpers). Helper functions to work with `Request` express object indirectly.
-   [Prettification](#prettification). Prettification feature is to better control data you send back to a client.

### Amn family

`Amn Express` has decoupled packages which are part of `amn` family and can simplify your experience with [express](https://expressjs.com/).

-   [Amn Validation](https://www.npmjs.com/package/amn-express-validate). Client’s input validation via schema employs [joi](https://joi.dev/)
-   [Amn Store](https://www.npmjs.com/package/amn-store). Introduce a key-value store to help share data through the middleware chain.
-   [Amn Error](https://www.npmjs.com/package/amn-error). Extends NodeJs `Error` class with extra field to deliver http status and more details over the natur of an error.

##### Disclaimer

AMN itself has minimum and ultra-light; nevertheless, as being a simple wrapper on top of `express` and other dependencies have to be installed installed upfront. Please follow **peer dependencies** warning at installation.

### Initialization

To build-in amn into your middleware pipeline, you have to call `amn.init` before any other router chained middleware.

You can initialize amn in two ways.

```javascript
// example 1
const amn = require('amn-express');

app.use(amn.init); // init amn itself
app.use(yourControllers); // your controller
app.use(amn.response); // amn response middleware
```

```javascript
// example 2
const amn = require('amn-express');

// you server.js routers call may looks like this.
app.user(
    '/api',
    amn.init, // please note `amn init` first middleware at the router middlewares pipeline
    yourControllers,
    amn.response // produce a response to a client
);
```

Besides, you easily can mix both scenarios.Obviously, the only matter is an order.

-   (1) amn.init
-   (2) controllers
-   (3) amn.response

### Response middleware

The main idea is to have a single response point to the client. It means that a middleware which has to build a response no longer need to be at the end of the middleware call chain.
AMN achieve it through the interim call of `amn.res.reply` to record reply message and keep it till the time `amn.res.response` lock the chain.

```javascript
myServiceMiddleware = (req, res, next) => {
    // so something useful
    const messageToClient = { ... , ... , ... };

    amn.res.reply(res, { name : 'myPrettificationFunc', payload: messageToClient} ); // amn.res.reply store data and alias for prettification
    next(); // this is mandatory to call next once middleware done it's job
}

// In case you have nothing to send back to client, you can simply call amn.res.empty
amn.res.empty(res); // return to client empty body and status 204 (no content)
```

Eventually, your middleware chain may look at the example below.
The key benefit, in case any error occurs at the middleware which goes after the one with `reply`, the client gets right error notification and your server will not cause a double reply error.

```javascript
// your routers
router.put(
    '/your/path',
    someMiddlewareOne,
    yourMiddlewareWithReply,
    someMiddlewareTwo
);
```

### Prettification

As long you are working with your data within server-side service layer, your data most likely has values you are not keen to share with a client.
It means before you reply you have to clean data up and prepare it. In case you have pretty much end-points which have to return same object to a client you need to be sure you post-process of your data before send it back.

`AMN Preffification` is came to simply this flow and centralize the logic you want to have at each time your server have to return same object to the client.
Besides, you be able to deeply customize the response, e.g. remove data from response, add new fields, adjust or fully rewrite values your back-end share with outer world.

In order to utilize this feature, in the first instance you have to register all your own prettification functions.

```javascript
const foo = ({ ..., ..., ... }) => {
    // do much stuff with your data
    return { ..., ..., ...};
}
/**
 * @param {String} alias a string name for your prettification function.
 * @param {Function} foo a custom function to post-process your resposnce data
 */
amn.prettify.set('myPrettificationFunc', foo);
```

Once your register all your custom post-processing functions, the functions become available to `amn.res.reply`

```javascript
amn.res.reply(res, { name: 'myPrettificationFunc', data: yourRowData }); // amn.res.reply store data and alias for prettification
```

`amn.response` middleware will check whether response data and pretiffication function available to run your code behind the scene before sending anything to a clint.

### Request helpers

The goal of the request handler is to provide a more convenient way to work with the client's input. Basically, it's a simple wrapper on top of `req.body`, `req.params`, `req.query`. But also allows you to get client's input from all three sources at once.

```javascript
/**
 * @param {Object} req request object from express connect middleware
 * @param {String} source [optional] may be 'body', 'params', 'query', if omitted set all together.
 */
amn.req.input(req, source);
```

```javascript
// examples

// get client input from 'body', 'params', and 'query' at once
const all = amn.req.input(req);

// get client input 'body' req.body
const body = amn.req.input(req, 'body');

// get client input 'params' req.params
const params = amn.req.input(req, 'params');

// get client input 'query' req.query
const query = amn.req.input(req, 'query');
```

**not yet implemented**

```javascript
// return uploaded files array (if any) otherwise return empty array
amn.req.files(req);
```

**not yet implemented**

```javascript
// return request method
amn.req.method(req);
```

### Url Not Found

`Amn Express` out of the box provides middleware plug for url not found. The middleware have to be added after all controllers call.

```javascript
app.use('/api', myControllers);
app.use(amn.urlNotFound);
```

The middleware invoke an error middleware.
HTTP response with status 404, message

Together with `amn-error` HTTP response with status 404, message

```javascript
{
    "code": "NOT_FOUND.PATH",
    "message": "path is not found"
}
```
