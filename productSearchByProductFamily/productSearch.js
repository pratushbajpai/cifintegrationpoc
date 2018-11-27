'use strict';

const HttpClient = require('node-rest-client').Client;

// This should point to some commerce backend URL to GET products
const baseurl = 'https://displaycatalog.mp.microsoft.com/v7.0/productfamilies/';

let url = baseurl;
function main(args) {

    let httpClient = new HttpClient();
    
    let market = "us";
    let languages = "neutral"
    let productFamily = "devices"
    let query = "*"
    let limit = null
    let offset = null
    let sort = null

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

    if(args.productFamily)
    {
        console.log("productFamily passed " + args.productFamily);
        productFamily = args.productFamily;
    }

    if(args.query)
    {
        console.log("query passed " + args.query);
        query = args.query;
    }
    
    if(args.limit)
    {
        console.log("limit passed " + args.limit);
        limit = args.limit;
    }

    if(args.offset)
    {
        console.log("offset passed " + args.offset);
        offset = args.offset;
    }
    
    if(args.sort)
    {
        console.log("sort passed " + args.sort);
        sort = args.sort;
    }
    
    url = baseurl + productFamily +"/products/"

    let queryString = "?market=" + market + "&languages=" + languages +"&MS-CV=search"+productFamily+".cifpoc.0" + "&query=" + query;
        
    if(limit)
    {
        queryString += "&$top=" + limit; 
    }

    if(offset)
    {
        queryString += "&$skip=" + offset; 
    }

    if(sort)
    {
        queryString += "&$orderby=" + sort; 
    }
    
    console.log("querystring  " + queryString);
    
    return new Promise((resolve, reject) => {
        console.log("calling URL  " + url);
        httpClient.get(url + queryString, function (data, response) {
            //console.log("success - raw response object  %j", response);
            //console.log("success - raw response data  %j", data);
            return resolve(buildResponse(data));
        }).on('error', function (err) {
            console.log("error in call " + err);
            return resolve(err)
        });
    });
}

function buildResponse(rawResponse) {

    if(!rawResponse.TotalResultCount || !rawResponse.Products )
    {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: rawResponse
            };         
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: mapResponse(rawResponse)
    };
}

function mapResponse(rawResponse)
{
    //console.log("products object %j", rawResponse.Products);
    return {
        "offset": 0,
        "count": rawResponse.Products.length,
        "total" : rawResponse.TotalResultCount,
        results : [
            mapProducts(rawResponse.Products)
        ]  
    };
}

function mapProducts(products)
{
    //console.log("products object %j", products);
    return products.map(product => mapProduct(product));
}

function mapProduct(product)
{
    //console.log("products object %j", product);
    return {
    id: product.ProductId,
    //sku: product.DisplaySkuAvailabilities[0].Sku.SkuId,
    name: product.LocalizedProperties[0].ProductTitle,
    // slug: not needed
    description: product.LocalizedProperties[0].ShortDescription,
    categories: [ // assuming categories are similar to availabilities, not aspects.
    {
        id: product.ProductFamily
    }
    ],
    prices: [
    {
    //country: product.DisplaySkuAvailabilities[0].Availabilities[0].Markets[0],
    currency: product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price.CurrencyCode,
    amount: product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price.ListPrice
    }
    ],
    assets: [
        product.LocalizedProperties[0].Images
    ]
};
}

module.exports.main = main;
