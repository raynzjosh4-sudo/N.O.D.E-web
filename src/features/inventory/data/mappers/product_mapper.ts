import { Product, PriceTier } from '../../domain/entities/product';
import { Supplier } from '@/features/home/domain/entities/supplier';
import { resolveImageUrl } from '@/core/utils/image_utils';
import {
  ProductListItemDto,
  ProductResponseDto,
  PriceTierDto,
  ProductCreateRequestDto,
  ProductUpdateRequestDto,
  SupplierDto,
  SupplierBusinessDto,
} from '../dto/product_dto';

export class ProductMapper {
  static fromSupplierDto(dto: SupplierDto): Supplier {
    const bizList = dto.business;
    const biz: SupplierBusinessDto =
      Array.isArray(bizList) && bizList.length > 0
        ? bizList[0]
        : (bizList && typeof bizList === 'object' && !Array.isArray(bizList)
            ? bizList
            : {});

    const name = biz.legal_name?.trim() || dto.full_name?.trim() || dto.name?.trim() || 'Verified Supplier';
    const imageUrl =
      biz.logo_url ||
      dto.imageUrl ||
      dto.image_url ||
      dto.profile_pic_url ||
      undefined;
    const category = biz.industry_group || dto.category || 'General Wholesale';

    const locationParts = [biz.physical_address, biz.city, biz.region, biz.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : 'East Africa';

    return {
      id: dto.id,
      name,
      imageUrl,
      category,
      location,
      rating: 4.9,
      productCount: 50,
      isVerified: true,
    };
  }

  static mapPriceTiers(tiersDto?: PriceTierDto[], defaultSrp = 0): PriceTier[] {
    if (tiersDto && tiersDto.length > 0) {
      return tiersDto.map((t) => ({
        minQuantity: t.minQuantity ?? 1,
        price: t.price ?? defaultSrp,
      }));
    }
    return [{ minQuantity: 1, price: defaultSrp }];
  }

  static fromListItemDto(dto: ProductListItemDto, index = 0): Product {
    // Generate staggered ratio pattern for Pinterest masonry view
    const staggeredRatios = [0.75, 0.9, 0.8, 0.85, 0.95];
    const aspectRatio = staggeredRatios[index % staggeredRatios.length];

    const priceTiers = this.mapPriceTiers(dto.price_tiers, dto.srp);

    return {
      id: dto.id,
      name: dto.name,
      brand: dto.brand || 'General',
      sku: dto.sku || '',
      srp: dto.srp,
      imageUrl: resolveImageUrl(dto.image_url),
      aspectRatio,
      supplierId: dto.supplier_id,
      supplierName: dto.supplier_name || 'Verified Supplier',
      categoryId: dto.category_id,
      warehouseLoc: 'Kampala, Uganda',
      priceTiers,
      status: 'active',
      stockQuantity: 100,
      moq: priceTiers[0]?.minQuantity || 1,
      moqText: `${priceTiers[0]?.minQuantity || 1} units min order`,
    };
  }

  static fromResponseDto(dto: ProductResponseDto): Product {
    const priceTiers = this.mapPriceTiers(dto.price_tiers, dto.srp);
    const moqNumber = dto.trading_terms?.moq
      ? parseInt(dto.trading_terms.moq, 10) || priceTiers[0]?.minQuantity || 1
      : priceTiers[0]?.minQuantity || 1;

    return {
      id: dto.id,
      name: dto.name,
      brand: dto.brand || 'General',
      sku: dto.sku || '',
      slug: dto.slug,
      srp: dto.srp,
      imageUrl: resolveImageUrl(dto.image_url),
      mediaUrls: dto.media_urls || (dto.image_url ? [dto.image_url] : []),
      aspectRatio: dto.aspect_ratio || 0.85,
      supplierId: dto.supplier?.id,
      supplierName: dto.supplier?.name || 'Verified Supplier',
      categoryId: dto.category_id,
      categoryName: dto.category_name,
      warehouseLoc: dto.warehouse_loc || dto.supplier?.location?.addressName || 'Kampala, Uganda',
      stockQuantity: dto.current_stock ?? 100,
      moq: moqNumber,
      moqText: dto.trading_terms?.moq || `${moqNumber} units min order`,
      material: dto.material,
      denier: dto.denier,
      hsCode: dto.hs_code,
      unbsNumber: dto.unbs_number,
      weight: dto.weight_kg ? `${dto.weight_kg} kg` : undefined,
      volumeCbm: dto.volume_cbm ? `${dto.volume_cbm} CBM` : undefined,
      originCountry: dto.origin_country,
      leadTimeDays: dto.lead_time_days ? String(dto.lead_time_days) : undefined,
      description: dto.description || dto.seo_description || '',
      warranty: dto.trading_terms?.warranty,
      paymentTerms: dto.trading_terms?.paymentTerms,
      deliveryTerms: dto.trading_terms?.deliveryTerms,
      supportWhatsapp: dto.support?.whatsapp,
      supportPhone: dto.support?.phone,
      supportEmail: dto.support?.email,
      seoTitle: dto.seo_title,
      seoDescription: dto.seo_description,
      colors: dto.available_colors?.map((c) => ({ name: c.name, hexCode: c.hexCode })) || [],
      sizes: dto.available_sizes?.map((s) => ({ name: s.name, abbreviation: s.abbreviation })) || [],
      materialsList: dto.available_materials?.map((m) => ({ name: m.name, imageUrl: m.imageUrl })) || [],
      priceTiers,
      status: (dto.current_stock && dto.current_stock > 0) ? 'active' : 'low_stock',
    };
  }

  static toCreateDto(
    product: Partial<Product> & { imageBase64?: string | null; newCategory?: any },
    fallbackSupplierId = '924fd9e2-25b5-4147-bb45-fbc3e4a8e785'
  ): ProductCreateRequestDto {
    const sku = product.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const srp = Number(product.srp) || 0;

    const priceTiers: PriceTierDto[] = (product.priceTiers && product.priceTiers.length > 0)
      ? product.priceTiers.map((t) => ({
          minQuantity: Number(t.minQuantity) || 1,
          price: Number(t.price) || srp,
          label: `${t.minQuantity}+ units`,
        }))
      : [{ minQuantity: 1, price: srp, label: 'Standard Wholesale' }];

    // Parse numeric fields safely
    const weightNum = product.weight ? parseFloat(product.weight.replace(/[^0-9.]/g, '')) : undefined;
    const volumeNum = product.volumeCbm ? parseFloat(product.volumeCbm.replace(/[^0-9.]/g, '')) : undefined;
    const leadDaysNum = product.leadTimeDays ? parseInt(product.leadTimeDays.replace(/[^0-9]/g, ''), 10) : undefined;

    return {
      sku,
      name: product.name?.trim() || 'Untitled Product',
      brand: product.brand?.trim() || 'General',
      srp,
      category_id: product.categoryId || null,
      new_category: product.newCategory || null,
      supplier_id: product.supplierId || fallbackSupplierId,
      image_url: product.imageUrl?.trim() || '',
      image_base64: product.imageBase64 || null,
      media_urls: product.mediaUrls || (product.imageUrl ? [product.imageUrl] : []),
      aspect_ratio: product.aspectRatio || 1.0,
      price_tiers: priceTiers,
      current_stock: product.stockQuantity ?? 100,
      lead_time_days: leadDaysNum,
      weight_kg: isNaN(weightNum as number) ? undefined : weightNum,
      volume_cbm: isNaN(volumeNum as number) ? undefined : volumeNum,
      warehouse_loc: product.warehouseLoc || 'Kampala, Uganda',
      material: product.material,
      denier: product.denier,
      hs_code: product.hsCode,
      unbs_number: product.unbsNumber,
      origin_country: product.originCountry || 'Uganda',
      seo_title: product.seoTitle,
      seo_description: product.seoDescription,
      available_colors: product.colors?.map((c) => ({ name: c.name, hexCode: c.hexCode })),
      available_sizes: product.sizes?.map((s) => ({ name: s.name, abbreviation: s.abbreviation })),
      available_materials: product.materialsList?.map((m) => ({ name: m.name, imageUrl: m.imageUrl })),
      support_info: {
        whatsapp: product.supportWhatsapp || '+256 700 000 000',
        phone: product.supportPhone || '+256 700 000 000',
        email: product.supportEmail || 'support@node.app',
      },
      trading_terms: {
        id: 'tt_default',
        content: 'Standard wholesale trade terms apply.',
        moq: product.moqText || (product.moq ? `${product.moq} units` : '1 unit'),
        warranty: product.warranty,
        paymentTerms: product.paymentTerms || 'Bank transfer / Mobile Money on invoice',
        deliveryTerms: product.deliveryTerms || 'FOB Kampala Warehouse',
      },
    };
  }

  static toUpdateDto(updates: Partial<Product> & { newCategory?: any }): ProductUpdateRequestDto {
    const payload: ProductUpdateRequestDto = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.brand !== undefined) payload.brand = updates.brand;
    if (updates.sku !== undefined) payload.sku = updates.sku;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.srp !== undefined) payload.srp = Number(updates.srp);
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.newCategory !== undefined) payload.new_category = updates.newCategory;
    if (updates.supplierId !== undefined) payload.supplier_id = updates.supplierId;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if ((updates as any).imageBase64 !== undefined) payload.image_base64 = (updates as any).imageBase64;
    if (updates.mediaUrls !== undefined) payload.media_urls = updates.mediaUrls;
    if (updates.aspectRatio !== undefined) payload.aspect_ratio = updates.aspectRatio;
    if (updates.stockQuantity !== undefined) payload.current_stock = updates.stockQuantity;
    if (updates.warehouseLoc !== undefined) payload.warehouse_loc = updates.warehouseLoc;
    if (updates.material !== undefined) payload.material = updates.material;
    if (updates.denier !== undefined) payload.denier = updates.denier;
    if (updates.hsCode !== undefined) payload.hs_code = updates.hsCode;
    if (updates.unbsNumber !== undefined) payload.unbs_number = updates.unbsNumber;
    if (updates.originCountry !== undefined) payload.origin_country = updates.originCountry;
    if (updates.seoTitle !== undefined) payload.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined || updates.description !== undefined) {
      payload.seo_description = updates.seoDescription || updates.description;
    }

    if (updates.weight !== undefined) {
      const weightNum = parseFloat(String(updates.weight).replace(/[^0-9.]/g, ''));
      if (!isNaN(weightNum)) payload.weight_kg = weightNum;
    }
    if (updates.volumeCbm !== undefined) {
      const volumeNum = parseFloat(String(updates.volumeCbm).replace(/[^0-9.]/g, ''));
      if (!isNaN(volumeNum)) payload.volume_cbm = volumeNum;
    }
    if (updates.leadTimeDays !== undefined) {
      const leadDaysNum = parseInt(String(updates.leadTimeDays).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(leadDaysNum)) payload.lead_time_days = leadDaysNum;
    }

    if (updates.priceTiers !== undefined) {
      payload.price_tiers = updates.priceTiers.map((t) => ({
        minQuantity: t.minQuantity,
        price: t.price,
        label: `${t.minQuantity}+ units`,
      }));
    }

    if (updates.colors !== undefined) {
      payload.available_colors = updates.colors.map((c) => ({ name: c.name, hexCode: c.hexCode }));
    }
    if (updates.sizes !== undefined) {
      payload.available_sizes = updates.sizes.map((s) => ({ name: s.name, abbreviation: s.abbreviation }));
    }
    if (updates.materialsList !== undefined) {
      payload.available_materials = updates.materialsList.map((m) => ({ name: m.name, imageUrl: m.imageUrl }));
    }

    if (
      updates.supportWhatsapp !== undefined ||
      updates.supportPhone !== undefined ||
      updates.supportEmail !== undefined
    ) {
      payload.support_info = {
        whatsapp: updates.supportWhatsapp || '+256 700 000 000',
        phone: updates.supportPhone || '+256 700 000 000',
        email: updates.supportEmail || 'support@node.app',
      };
    }

    if (
      updates.moq !== undefined ||
      updates.moqText !== undefined ||
      updates.warranty !== undefined ||
      updates.paymentTerms !== undefined ||
      updates.deliveryTerms !== undefined
    ) {
      payload.trading_terms = {
        id: 'tt_default',
        content: 'Standard wholesale trade terms apply.',
        moq: updates.moqText || (updates.moq ? `${updates.moq} units` : '1 unit'),
        warranty: updates.warranty,
        paymentTerms: updates.paymentTerms || 'Bank transfer / Mobile Money on invoice',
        deliveryTerms: updates.deliveryTerms || 'FOB Kampala Warehouse',
      };
    }

    return payload;
  }
}

