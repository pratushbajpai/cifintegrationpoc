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
const url = 'https://reco.rec.mp.microsoft.com/channels/reco/v8.0/related/';

function main(args) {
    let httpClient = new HttpClient();

    //set default product id
    let productId = "9NZ0MH20FTWN";
    let market = "us";
    let language = "en";
    let itemType = "apps";
    let deviceFamily = "windows.desktop";
    let count = 10;
    let clientType = "omnichannel-edge";

    if (args.productId) {
        console.log("productId passed " + args.productId);
        productId = args.productId;
    }

    if (args.market) {
        console.log("market passed " + args.market);
        market = args.market;
    }

    if (args.language) {
        console.log("language passed " + args.language);
        language = args.language;
    }

    if (args.itemType) {
        console.log("itemType passed " + args.itemType);
        itemType = args.itemType;
    }

    if (args.deviceFamily) {
        console.log("deviceFamily passed " + args.deviceFamily);
        deviceFamily = args.deviceFamily;
    }

    if (args.count) {
        console.log("count passed " + args.count);
        count = args.count;
    }

    let queryString = itemType + "/" + productId + "?market=" + market + "&language=" + language + "&itemTypes=" + itemType + "&deviceFamily=" + deviceFamily + "&count=" + count + "&clientType=" + clientType + "&isTest=true";

    return new Promise((resolve) => {
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

function buildResponse(recoResponse) {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: recoResponse
    };
}

module.exports.main = main;