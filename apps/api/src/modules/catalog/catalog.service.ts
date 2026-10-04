import { Business } from '../business/business.model.js';
import { Item } from '../items/item.model.js';
import { Variant } from '../items/variant.model.js';
import { buildCloudinaryPreviewUrl, buildCloudinaryThumbnailUrl } from '../../lib/cloudinary.js';

export const catalogService = {
  async getById(businessId: string) {
    const business = await Business.findByPk(businessId);
    if (!business) return null;

    const items = await Item.findAll({
      where: {
        businessId,
        visibleInCatalog: true,
      },
      include: [
        {
          model: Variant,
          as: 'variants',
          where: { isActive: true },
          required: false,
          order: [['size', 'ASC'], ['color', 'ASC']],
        },
      ],
      order: [['name', 'ASC']],
    });

    return {
      business: {
        id: business.id,
        name: business.name,
        displayName: business.displayName,
        description: business.description,
        logoUrl: buildCloudinaryPreviewUrl(business.logoPublicId),
        coverUrl: buildCloudinaryPreviewUrl(business.coverPublicId),
        whatsapp: business.catalogWhatsapp,
        currencySymbol: business.currencySymbol,
        shippingPolicy: business.shippingPolicy,
        returnPolicy: business.returnPolicy,
        socialLinks: business.socialLinks,
      },
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        gender: item.gender,
        brand: item.brand,
        description: item.description,
        material: item.material,
        careInstructions: item.careInstructions,
        thumbnailUrl: item.variants?.[0]?.imagePublicId
          ? buildCloudinaryThumbnailUrl(item.variants[0].imagePublicId)
          : null,
        variants: (item.variants ?? []).map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          sku: v.sku,
          price: v.price ?? item.price,
          stock: v.stock,
          imageUrl: buildCloudinaryPreviewUrl(v.imagePublicId),
          thumbnailUrl: buildCloudinaryThumbnailUrl(v.imagePublicId),
        })),
      })),
    };
  },
};