'use strict';

function mapProduct(product)
{
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

module.exports.mapProduct = mapProduct;
