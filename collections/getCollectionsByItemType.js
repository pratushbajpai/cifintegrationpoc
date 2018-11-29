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
const recoUrl = 'https://reco.rec.mp.microsoft.com/channels/reco/v8.0/lists/';

function main(args) {
    let listType = "app";
    let market = "us";
    let language = "en";
    let deviceFamily = "windows.desktop";
    let count = 10;

    if (args.listType) {
        console.log("listType passed " + args.listType);
        listType = args.listType;
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
        return resolve(getRecoResponse(listType, market, language, deviceFamily, count));
    });
}

async function getRecoResponse(listType, market, language, deviceFamily, count) {
    let httpClient = new HttpClient();

    let recoQueryString = "/loc/" + listType + "?market=" + market + "&language=" + language + "&deviceFamily=" + deviceFamily + "&count=" + count + "&clientType=omnichannel-edge&isTest=true";

    var recoResponse = await new Promise((resolve) => {
        httpClient.get(recoUrl + recoQueryString, function (data) {
            return resolve(data);
        }).on('error', function (err) {
            console.log("error in call " + err);
            return resolve(err);
        })
    });

    return buildResponse(market, language, recoResponse);
}

function buildResponse(market, language, recoResponse) {
    if (!recoResponse.Items) {
        console.log("unexpected response from reco %j", recoResponse);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: recoResponse
        };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: mapResponse(market, language, recoResponse)
    };
}

function mapResponse(market, language, recoResponse) {
   let results = mapResults(recoResponse.Items);

   return {
        "title": recoResponse.Title,
	"market": market,
	"language": language,
        "results": results
    };
}

function mapResults(recoItems) {
    return recoItems.map(recoItem => mapResult(recoItem));
}

function mapResult(recoItem) {
    return {
        "itemType": recoItem.ItemType,
	"collectionKey": getValueFromArrayByName(recoItem.ExtraData, "Name", "CollectionKey"),
	"title": getValueFromArrayByName(recoItem.ExtraData, "Name", "Title"),
	"description": getValueFromArrayByName(recoItem.ExtraData, "Name", "Description"),
	"imageUrl": getValueFromArrayByName(recoItem.ExtraData, "Name", "ImageUrl"),
	"backgroundColor": getValueFromArrayByName(recoItem.ExtraData, "Name", "BackgroundColor"),
	"foregroundColor": getValueFromArrayByName(recoItem.ExtraData, "Name", "ForegroundColor"),
	"imageHeight": getValueFromArrayByName(recoItem.ExtraData, "Name", "ImageHeight"),
	"imageWidth": getValueFromArrayByName(recoItem.ExtraData, "Name", "ImageWidth"),
        "predictedScore": recoItem.PredictedScore
    };
}

function getValueFromArrayByName(data, propertyName, value) {
    let item = selectWhere(data, propertyName, value);

    if (item) {
	return item.Value;
    }

    return null;
}

function selectWhere(data, propertyName, value) {
    for (var i = 0; i < data.length; i++) {
        if (data[i][propertyName] == value) return data[i];
    }
    return null;
}

module.exports.main = main;
