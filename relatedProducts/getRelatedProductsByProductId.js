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
const recoUrl = 'https://reco.rec.mp.microsoft.com/channels/reco/v8.0/related/';
const catalogUrl = 'https://displaycatalog.mp.microsoft.com/v7.0/products';

function main(args) {
    //set default product id
    let productId = "9NZ0MH20FTWN";
    let market = "us";
    let language = "en";
    let itemType = "apps";
    let deviceFamily = "windows.desktop";
    let count = 10;

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

    return new Promise((resolve) => {
        return resolve(getRecoResponse(productId, itemType, market, language, deviceFamily, count));
    });
}

async function getRecoResponse(productId, itemType, market, language, deviceFamily, count) {
    let httpClient = new HttpClient();

    let recoQueryString = itemType + "/" + productId + "?market=" + market + "&language=" + language + "&itemTypes=" + itemType + "&deviceFamily=" + deviceFamily + "&count=" + count + "&clientType=omnichannel-edge&isTest=true";

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

    return buildResponse(recoResponse, catalogResponse);
}

function buildResponse(recoResponse, catalogResponse) {
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
        body: mapResponse(recoResponse, catalogResponse)
    };
}

function mapResponse(recoResponse, catalogResponse) {
    return {
        "Title": recoResponse.Title,
        "Results": mapResults(recoResponse.Items, catalogResponse.Products)
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
        "ItemType": recoItem.ItemType,
        "Product": [mapProduct(catalogProduct)],
        "PredictedScore": recoItem.PredictedScore
    };
}

function mapProduct(product) {
    let mappedProduct = {
        id: product.ProductId,
        //sku: product.DisplaySkuAvailabilities[0].Sku.SkuId,
        name: product.LocalizedProperties[0].ProductTitle,
        // slug: not needed
        description: product.LocalizedProperties[0].ShortDescription,
        categories: [ // assuming categories are similar to availabilities, not aspects.
            {
                id: product.ProductFamily
            }
        ]
    };
    if (product.LocalizedProperties[0].Images) {
        let images = product.LocalizedProperties[0].Images;
        mappedProduct.assets = images;
    }

    if (product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price) {
        let price = product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price;
        mappedProduct.prices = [
            {
                currency: price.CurrencyCode,
                amount: price.ListPrice
            }
        ];
    }

    return mappedProduct;
}
module.exports.main = main;