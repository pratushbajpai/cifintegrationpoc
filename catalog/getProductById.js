/*******************************************************************************
 *
 *    Copyright 2018 Adobe. All rights reserved.
 *    This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License. You may obtain a copy
 *    of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software distributed under
 *    the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *    OF ANY KIND, either express or implied. See the License for the specific language
 *    governing permissions and limitations under the License.
 *
 ******************************************************************************/
'use strict';

const HttpClient = require('node-rest-client').Client;

// This should point to some commerce backend URL to GET products
const url = 'https://displaycatalog.mp.microsoft.com/v7.0/products';

let sampleProductData = {
    pid: '123',
    name: 'A simple name',
    price: {
        currencyCode: 'USD',
        value: 10
    }
}

function main(args) {

    let httpClient = new HttpClient();
    
    //set default product id
    let productId = "90JQ334BBK5S";
    let market = "us";
    let languages = "neutral"
    if(args.id)
    {
        console.log("id passed " + args.id);
        productId = args.id;
    }

    if(args.market)
    {
        console.log("market passed " + args.market);
        market = args.market;
    }

    if(args.languages)
    {
        console.log("languages passed " + args.languages);
        languages = args.languages;
    }
    
    let queryString = "?productId=" + productId + "&market=" + market + "&languages=" + languages +"&MS-CV="+productId+".cifpoc.0";
    
    return new Promise((resolve, reject) => {
        httpClient.get(url + queryString, function (data, response) {
            console.log("success - raw response object  " + response);
            console.log("success - raw response data  " + data);
            return resolve(buildResponse(data));
        }).on('error', function (err) {
            console.log("error in call " + err);
            return resolve(err)
        });
    });
}

function buildResponse(backendProduct) {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        //body: mapProduct(backendProduct)
        body: backendProduct
    };
}

/**
 * Example conversion of a commerce backend product into a CIF product
 * 
 * @param backendProduct The JSON product data coming from the commerce system backend.
 * @returns a CIF product.
 */
function mapProduct(backendProduct) {
    return {
        id: backendProduct.pid,
        name: {
            en: backendProduct.name
        },
        prices: [
            {
                currency: backendProduct.price.currencyCode,
                centAmount: backendProduct.price.value * 100
            }
        ]
    };
}

module.exports.main = main;
