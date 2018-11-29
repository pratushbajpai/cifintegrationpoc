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

let mp = require('./mapProduct');

const HttpClient = require('node-rest-client').Client;

// This should point to some commerce backend URL to GET products
const recoUrl = 'https://reco.rec.mp.microsoft.com/channels/reco/v8.0/lists/collection/';
const catalogUrl = 'https://displaycatalog.mp.microsoft.com/v7.0/products';

function main(args) {
    //set default product id
    let collectionKey = "PCBigFishGames";
    let market = "us";
    let language = "en";
    let deviceFamily = "windows.desktop";
    let count = 10;

    if (args.collectionKey) {
        console.log("collectionKey passed " + args.collectionKey);
        collectionKey = args.collectionKey;
    }

    if (args.market) {
        console.log("market passed " + args.market);
        market = args.market;
    }

    if (args.language) {
        console.log("language passed " + args.language);
        language = args.language;
    }

    if (args.deviceFamily) {
        console.log("deviceFamily passed " + args.deviceFamily);
        deviceFamily = args.deviceFamily;
    }

    if (args.count) {
        console.log("count passed " + args.count);
        count = args.count;
    }

    return new Promise((resolve) => {
        return resolve(getRecoResponse(collectionKey, market, language, deviceFamily, count));
    });
}

async function getRecoResponse(collectionKey, market, language, deviceFamily, count) {
    let httpClient = new HttpClient();

    let recoQueryString = collectionKey + "?market=" + market + "&language=" + language + "&deviceFamily=" + deviceFamily + "&count=" + count + "&clientType=omnichannel-edge&isTest=true";

    var recoResponse = await new Promise((resolve) => {
        httpClient.get(recoUrl + recoQueryString, function (data) {
            return resolve(data);
        }).on('error', function (err) {
            console.log("error in call " + err);
            return resolve(err);
        })
    });

    let bigIds = [];

    recoResponse.Items.forEach(item => {
        bigIds.push(item.Id);
    });

    let catalogQueryString = "?MS-CV=searchproductFamily.cifpoc.0" + "&bigIds=" + bigIds.join(",") + "&market=" + market + "&languages=" + language;

    var catalogResponse = await new Promise((resolve) => {
        httpClient.get(catalogUrl + catalogQueryString, function (data) {
            return resolve(data);
        }).on('error', function (err) {
            console.log("error in call " + err);
            return resolve(err);
        })
    });

    return buildResponse(collectionKey, market, language, recoResponse, catalogResponse);
}

function buildResponse(collectionKey, market, language, recoResponse, catalogResponse) {
    if (!recoResponse.Items) {
        console.log("unexpected response from reco %j", recoResponse);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: recoResponse
        };
    }

    if (!catalogResponse.Products) {
        console.log("unexpected response from catalog %j", catalogResponse);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: catalogResponse
        };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: mapResponse(collectionKey, market, language, recoResponse, catalogResponse)
    };
}

function mapResponse(collectionKey, market, language, recoResponse, catalogResponse) {
    return {
        "title": recoResponse.Title,
	"id": collectionKey,
	"market": market,
	"language": language,
        "results": mapResults(recoResponse.Items, catalogResponse.Products)
    };
}

function mapResults(recoItems, catalogProducts) {
    return recoItems.map(recoItem => mapResult(recoItem, catalogProducts));
}

function selectWhere(data, propertyName, value) {
    for (var i = 0; i < data.length; i++) {
        if (data[i][propertyName] == value) return data[i];
    }
    return null;
}

function mapResult(recoItem, catalogProducts) {
    var catalogProduct = selectWhere(catalogProducts, "ProductId", recoItem.Id);

    return {
        "itemType": recoItem.ItemType,
        "product": [mp.mapProduct(catalogProduct)],
        "predictedScore": recoItem.PredictedScore
    };
}

module.exports.main = main;
