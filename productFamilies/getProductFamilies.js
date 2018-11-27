'use strict';

const HttpClient = require('node-rest-client').Client;

// This should point to some commerce backend URL to GET products
const url = 'https://displaycatalog.mp.microsoft.com/v7.0/productfamilies';

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
    
    //set defaults
    let market = "us";
    let languages = "neutral"
    
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
    
    let queryString = "?market=" + market + "&languages=" + languages +"&MS-CV=Categories"+market+".cifpoc.0";
    
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

//TODO - convert to category after due mapping.
/*
function mapCatagory(backendCategories)
{
var product = backendProduct.Product;
return {
id: product.ProductId,
sku: product.DisplaySkuAvailabilities[0].Sku.SkuId,
name: product.LocalizedProperties[0].ProductTitle,
// slug: not needed
description: product.LocalizedProperties[0].ShortDescription,
categories: [ // assuming categories are similar to availabilities, not aspects.
{
id: product.DisplaySkuAvailabilities[0].Availabilities[0].AvailabilityId
}
],
prices: [
{
country: product.DisplaySkuAvailabilities[0].Availabilities[0].Markets[0],
currency: product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price.CurrencyCode,
amount: product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price.ListPrice
}
],
assets: [
{
id: product.DisplaySkuAvailabilities[0].Sku.LocalizedProperties[0].Images[0].Caption, // not really an ID but we don't use id's for images
url: product.DisplaySkuAvailabilities[0].Sku.LocalizedProperties[0].Images[0].Uri
}
],
// attributes. Too many fields fit here, we will have to reorder them around the CIF product
createdAt: product.Properties.RevisionId,
lastModifiedAt: product.DisplaySkuAvailabilities[0].Sku.LastModifiedDate,
// masterVariantId: we could use P/S/A
// variants and categories seem similar to our availabilities but with pricing data externally
};
}*/

module.exports.main = main;
