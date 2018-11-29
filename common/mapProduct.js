'use strict';

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

module.exports.mapProduct = mapProduct;
