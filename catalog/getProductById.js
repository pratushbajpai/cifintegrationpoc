'use strict';
//let mp = require('./mapProduct');

const HttpClient = require('node-rest-client').Client;

// This should point to some commerce backend URL to GET products
const url = 'https://displaycatalog.mp.microsoft.com/v7.0/products';

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
    let mscv = productId+".search.cifpoc.0"
    
    if(args.market)
    {
        console.log("market passed " + args.market);
        market = args.market;
    }

    if(args.mscv)
    {
        console.log("mscv passed " + args.mscv);
        mscv = args.mscv + "search.cifpoc.0";
    }


    if(args.languages)
    {
        console.log("languages passed " + args.languages);
        languages = args.languages;
    }
    
    let queryString = "?productId=" + productId + "&market=" + market + "&languages=" + languages +"&MS-CV="+mscv;
    
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
    if(!backendProduct.Product)
    {
        return {
            statusCode :404,
            headers: { 'Content-Type': 'application/json' },
            body: {
                code:"ProductNotFound",
                description: "catalog product not found"
            }
        }
    }
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: mapProduct(backendProduct.Product)
    };
}

function mapProduct(product)
{
    var mappedProduct = {
    id: product.ProductId,
    
    categories: [ // assuming categories are similar to availabilities, not aspects.
        {
            id: product.ProductFamily//product.DisplaySkuAvailabilities[0].Availabilities[0].AvailabilityId
        }
        ]
    };
    
    if(product.DisplaySkuAvailabilities)
    {
        if(product.DisplaySkuAvailabilities[0].Sku)
        {
            mappedProduct.sku = product.DisplaySkuAvailabilities[0].Sku.SkuId;
            mappedProduct.lastModifiedAt = product.DisplaySkuAvailabilities[0].Sku.LastModifiedDate;
        }
        if(product.DisplaySkuAvailabilities[0].Availabilities)
        {
            mappedProduct.masterVariantId = product.DisplaySkuAvailabilities[0].Availabilities[0].AvailabilityId;

            if(product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData)
            {
                let price =  product.DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price;
                let market = null
                if(product.DisplaySkuAvailabilities[0].Availabilities[0].Markets)
                {
                    market = product.DisplaySkuAvailabilities[0].Availabilities[0].Markets[0];
                }
                if(price)
                {
                    mappedProduct.prices = [
                        {
                        country: market,
                        currency: price.CurrencyCode,
                        amount: price.ListPrice
                        }
                    ];
                }
            }
        }
    }
    
    if(product.Properties)
    {
        mappedProduct.createdAt = product.Properties.RevisionId;
    }
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
