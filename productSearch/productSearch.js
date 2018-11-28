'use strict';

const HttpClient = require('node-rest-client').Client;

let market = "us";

// This should point to some commerce backend URL to GET products
const baseurl ="https://displaycatalog.mp.microsoft.com/v7.0/productfamilies/products";

let url = baseurl;
function main(args) {

    let httpClient = new HttpClient();
    
    let languages = "neutral"
    let productFamily = "All"
    let query = "*"
    let topProducts = null
    let topFamilies = null
    let skipFamilies = null
    let mscv = "productsearch.cifpoc.0"

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
    
    if(args.$topProducts)
    {
        console.log("$topProducts passed " + args.$topProducts);
        topProducts = args.$topProducts;
    }

    if(args.$topFamilies)
    {
        console.log("$topFamilies passed " + args.$topFamilies);
        topFamilies = args.$topFamilies;
    }
    
    if(args.$skipFamilies)
    {
        console.log("$skipFamilies passed " + args.$skipFamilies);
        skipFamilies = args.$skipFamilies;
    }

    if(args.mscv)
    {
        console.log("mscv passed " + args.mscv);
        mscv = args.mscv + ".cifpoc.01";
    }
    
    url = baseurl;
    
    let queryString = "?market=" + market + "&languages=" + languages +"&MS-CV="+ mscv+"&productFamilyNames="+ productFamily +"&query=" + query;
    
    if(skipFamilies)
    {
        queryString += "&$skipFamilies=" + skipFamilies; 
    }

    if(topFamilies)
    {
        queryString += "&$topFamilies=" + topFamilies; 
    }

    if(topProducts)
    {
        queryString += "&$topProducts=" + topProducts; 
    }
    
    console.log("querystring  " + queryString);
    
    return new Promise((resolve, reject) => {
        console.log("calling URL  " + url);
        httpClient.get(url + queryString, function (data, response) {
            return resolve(buildResponse(data));
        }).on('error', function (err) {
            console.log("error in call " + err);
            return resolve(err)
        });
    });
}
function buildResponse(rawResponse) {

    if(!rawResponse.Results)
    {
        console.log("unexpected response from catalog %j", rawResponse);
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
        "HasMorePages": rawResponse.HasMorePages,
        "TotalFamilyCount": rawResponse.TotalFamilyCount,
        "Results" :
            mapResults(rawResponse.Results)
    };
}

function mapResults(results)
{
    //console.log("products object %j", products);
    return results.map(result => mapResult(result));
}

function mapResult(result)
{
    return {
        "ProductFamilyName": result.ProductFamilyName,
        "Products": mapProducts(result.Products),
        "TotalProductCount": result.TotalProductCount,
        "Market": market
    };
}
function mapProducts(products)
{
    //console.log("products object %j", products);
    return products.map(product => mapProduct(product));
}

function mapProduct(product)
{
    console.log("products object %j", product);
    let mappedProduct = {
        id: product.ProductId,
        categories: [ // assuming categories are similar to availabilities, not aspects.
            {
                id: product.ProductFamily
            }
            ]
        };
    
    if(product.LocalizedProperties)
    {
        mappedProduct.name = product.LocalizedProperties[0].ProductTitle;
        mappedProduct.description = product.LocalizedProperties[0].ShortDescription;
    }

    if(product.LocalizedProperties[0].Images)
    {
        let images =  product.LocalizedProperties[0].Images;
        mappedProduct.assets = mapImages(images);
    }

    if(product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData && product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price)
    {
        let price =  product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price;
        mappedProduct.prices = [
            {
                currency: price.CurrencyCode,
                amount: price.ListPrice
            }
        ];
    }
    
    return mappedProduct;
}

function mapImages(images)
{
    return images.map(image => mapImage(image));
}

function mapImage(image)
{
    console.log("image object %j", image);
    return  {
        id: image.Caption,
        url: image.Uri,
        imagePurpose: image.ImagePurpose,
        height: image.Height,
        width: image.Width,
        backgroundColor: image.BackgroundColor
    }
}
module.exports.main = main;
