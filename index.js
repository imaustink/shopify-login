'use strict';
const Request = require('request');
const Cheerio = require('cheerio');
// This ungly son of B should get the store handle from just about any garbage you throw at it
const STORE_HANDLE_REGEX = /(?:https?:)?(?:\/\/)?([a-z0-9-]+)(?:.myshopify)?(?:.com)?/i;

function mergeObject(){
    var out = {};
    for(let i = 0; i < arguments.length; i++)
        for(let f in arguments[i])
            if(arguments[i].hasOwnProperty(f))
                out[f] = arguments[i][f];
    return out; 
}

class ShopifyLogin{
    constructor(url, options){
        if(!url) throw new Error('URL is required!');
        // Parse store handle from URL
        var handle = url.match(STORE_HANDLE_REGEX)[1];
        // Save URL
        this.url = `https://${handle}.myshopify.com`;
        // Save options
        this.options = mergeObject(this.defaults, options);
        // Init a new instance of Request with a cookie jar
        this.Request = Request.defaults({
            jar: true,
            json: this.options.json
        });      
    }

    // Logs in and gets auth token, cookies and CSRF token
    authenticate(user, cb){
        this.getAuthToken((err, authenticity_token) => {
            if(err) return cb.call(this, err);
            this.login(user, authenticity_token, (err, cookie) => {
                if(err) return cb.call(this, err);
                this.getCSRFToken((err, csrf_token) => {
                    if(err) return cb.call(this, err);
                    cb.call(this, null, this.Request, {
                        authenticity_token: authenticity_token,
                        csrf_token: csrf_token
                    });
                });
            });
        });
    }

    // Makes a login request
    login(user, token, cb){
        this.log('Spoofing login...');
        this.Request.post({
            url: `${this.url}/admin/auth/login`,
            json: false,
            form: {
                utf8: '✓',
                authenticity_token: token,
                redirect: '',
                login: user.email,
                password: user.password,
                commit: 'Log in'
            }
        }, (err, result, body) => {
            if(err) return cb.call(this, err);
            // Shopify returns 200 for failed logins, success is a 302
            if(result.statusCode !== 302) return cb.call(this, new Error('Failed to login!'));

            this.log('Login successful');
            cb.call(this, null, result);
        });
    }

    // Gets CSRF token from admin panel
    getCSRFToken(cb){
        this.log('Getting csrf_token...');
        this.Request.get({
            url: `${this.url}/admin`,
            json: false
        }, (err, result, body) => {
            if(err) return cb.call(this, err);
            if(result.statusCode !== 200) return new Error('Failed to get auth token!');
            var $ = Cheerio.load(body);
            var token = $('[name="csrf-token"]').attr('content');
            this.log(`Got csrf_token ${token}`);
            cb.call(this, null, token);
        });
    }

    // Get auth token
    getAuthToken(cb){
        this.log('Getting authenticity_token...');
        this.Request.get({
            url: `${this.url}/admin/auth/login`,
            json: false
        }, (err, result, body) => {
            if(err) return cb.call(this, err);
            if(result.statusCode !== 200) return new Error('Failed to get auth token!');
            var $ = Cheerio.load(body);
            var token = $('[name="authenticity_token"]').attr('value');
            this.log(`Got authenticity_token ${token}`);
            cb.call(this, null, token);
        });
    }

    // Logger
    log(message){
        if(this.options.verbose) console.log(message);
    }
}

// Default options
ShopifyLogin.prototype.defaults = {
    verbose: false,
    json: true
};

module.exports = ShopifyLogin;