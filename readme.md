# ShopifyLogin
###### Requires Node.js version 4.0.0 or higher.
## Description
This module is a lightweight wrapper for the [request](https://www.npmjs.com/package/request) module. It provides a simple interface for spoofing login requests to Shopify's backend, allowing you to make requests to undocumented, private endpoints.

## Why?
Say you want to write a program that imports order comments, programatically create gift cards and discounts without Plus or automate just about any task in the Shopify admin panel, this is a good starting point.

## How?
This module will take care of the authentication handshake for you, just call ```.authenticate(user, callback)``` and it will give you back an instance of request with a cookie jar containing the logged in session already setup as the first argument, from there you can just make HTTP calls to Shopify. Some calls will require an authenticity_token and/or csfr_token, third argument is an object containing those tokens.
``` javascript
const ShopifyLogin = require('shopify-login');
// Init ShopifyLogin
const Shopify = new ShopifyLogin('https://store-handle.myshopify.com');

// Login to Shopify with user account credintials
Shopify.authenticate({
    email: 'email@example.com',
    password: 'P@$$word'
}, (err, request, tokens) => {
    // Check for error logging in
    if(err) return console.error(err);
    // Get gift cards
    request.get(`${this.url}/admin/gift_cards.json`, function(err, result, body){
        // Check for errors
        if(err) return console.error(err);
        // Log gift cards
        console.log(body.gift_cards);
    });
});
```