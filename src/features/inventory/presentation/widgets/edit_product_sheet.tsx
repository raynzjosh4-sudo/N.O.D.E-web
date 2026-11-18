import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '@/core/widgets/whatsapp_dialog';
import { Product, PriceTier, ProductColor, ProductSize, ProductMaterialItem } from '../../domain/entities/product';
import { useProducts } from '../../context/products_context';
import { ProductApiService } from '../../data/services/product_api_service';
import { CategoryDto } from '../../data/dto/product_dto';
import { useAuth } from '@/features/auth/context/auth_context';
import { CategoryBranchPicker, CategorySelectionResult } from './category_branch_picker';

interface EditProductSheetProps {
  visible: boolean;
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}



// Presets by Category
const SIZE_PRESETS_CATALOG = {
  apparel: [
    { name: 'Extra Small', abbreviation: 'XS' },
    { name: 'Small', abbreviation: 'S' },
    { name: 'Medium', abbreviation: 'M' },
    { name: 'Large', abbreviation: 'L' },
    { name: 'Extra Large', abbreviation: 'XL' },
    { name: '2X Large', abbreviation: '2XL' },
    { name: '3X Large', abbreviation: '3XL' },
    { name: 'One Size Fits All', abbreviation: 'FREE' },
  ],
  shoes: [
    { name: 'EU 38 / US 6', abbreviation: 'EU38' },
    { name: 'EU 39 / US 6.5', abbreviation: 'EU39' },
    { name: 'EU 40 / US 7', abbreviation: 'EU40' },
    { name: 'EU 41 / US 8', abbreviation: 'EU41' },
    { name: 'EU 42 / US 8.5', abbreviation: 'EU42' },
    { name: 'EU 43 / US 9.5', abbreviation: 'EU43' },
    { name: 'EU 44 / US 10', abbreviation: 'EU44' },
    { name: 'EU 45 / US 11', abbreviation: 'EU45' },
  ],
  storage: [
    { name: '32 Gigabytes', abbreviation: '32GB' },
    { name: '64 Gigabytes', abbreviation: '64GB' },
    { name: '128 Gigabytes', abbreviation: '128GB' },
    { name: '256 Gigabytes', abbreviation: '256GB' },
    { name: '512 Gigabytes', abbreviation: '512GB' },
    { name: '1 Terabyte', abbreviation: '1TB' },
    { name: '2 Terabytes', abbreviation: '2TB' },
  ],
  bulkPacks: [
    { name: 'Carton of 12 pcs', abbreviation: '12-Pack' },
    { name: 'Carton of 24 pcs', abbreviation: '24-Pack' },
    { name: 'Master Box 48 pcs', abbreviation: '48-Pack' },
    { name: 'Commercial Pallet', abbreviation: 'Pallet' },
  ],
};

type ActiveSection = 'identity' | 'variants' | 'pricing' | 'logistics' | 'support';

export function EditProductSheet({
  visible,
  product,
  onClose,
  onSuccess,
}: EditProductSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { user } = useAuth();
  const { updateProduct, addProduct, publishProduct, deleteProduct } = useProducts();
  const { showSuccess, showError } = useToast();

  const isEditing = Boolean(product);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoryPath, setCategoryPath] = useState('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const [activeSection, setActiveSection] = useState<ActiveSection>('identity');

  // --- Section 1: Basic Identity ---
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'low_stock' | 'draft'>('active');

  // --- Section 2: Variants & Attributes ---
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);
  const [materialsList, setMaterialsList] = useState<ProductMaterialItem[]>([]);
  const [primaryMaterial, setPrimaryMaterial] = useState('');
  const [denier, setDenier] = useState('');

  // Color Custom Add
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#12BBF0');

  // Custom Size & Dimensions
  const [customSizeName, setCustomSizeName] = useState('');
  const [customSizeAbbr, setCustomSizeAbbr] = useState('');

  // Custom Material
  const [customMaterialName, setCustomMaterialName] = useState('');

  // --- Section 3: Wholesale & Pricing ---
  const [srp, setSrp] = useState('');
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [newTierQty, setNewTierQty] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');

  // --- Section 4: Logistics & Compliance ---
  const [hsCode, setHsCode] = useState('');
  const [unbsNumber, setUnbsNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [volumeCbm, setVolumeCbm] = useState('');
  const [originCountry, setOriginCountry] = useState('China');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [leadTimeDays, setLeadTimeDays] = useState('3');
  const [warehouseLoc, setWarehouseLoc] = useState('Kampala Central');
  const [packaging, setPackaging] = useState('');
  const [warranty, setWarranty] = useState('1 Year Official');
  const [compliance, setCompliance] = useState('UNBS Certified • CE');

  // --- Section 5: Trading Terms & Support ---
  const [moq, setMoq] = useState('5');
  const [paymentTerms, setPaymentTerms] = useState('30% Downpayment, 70% before delivery');
  const [deliveryTerms, setDeliveryTerms] = useState('FOB Kampala or Direct Pallet Courier');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    ProductApiService.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    }).catch((err) => {
      console.warn('Could not load categories:', err.message);
    });
  }, []);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setBrand(product.brand || '');
      setCategoryId(product.categoryId || '');
      setCategoryName(product.categoryName || '');
      setCategoryPath(product.categoryName || '');
      setSku(product.sku || '');
      setSlug(product.slug || product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '');
      setImageUrl(product.imageUrl || '');
      setDescription(product.description || '');
      setStatus((product.status as any) || 'active');

      setProductColors(product.colors ? [...product.colors] : []);
      setProductSizes(product.sizes ? [...product.sizes] : []);
      setMaterialsList(product.materialsList ? [...product.materialsList] : []);
      setPrimaryMaterial(product.material || '');
      setDenier(product.denier || '');

      setSrp(product.srp ? product.srp.toString() : '');
      setPriceTiers(product.priceTiers ? [...product.priceTiers] : []);
      setMediaUrls(product.mediaUrls ? [...product.mediaUrls] : []);

      setHsCode(product.hsCode || '');
      setUnbsNumber(product.unbsNumber || '');
      setWeight(product.weight || '');
      setVolumeCbm(product.volumeCbm || '');
      setOriginCountry(product.originCountry || 'Uganda');
      setStockQuantity(product.stockQuantity !== undefined ? product.stockQuantity.toString() : '50');
      setLeadTimeDays(product.leadTimeDays || '2');
      setWarehouseLoc(product.warehouseLoc || 'Kampala Central');
      setPackaging(product.packaging || '');
      setWarranty(product.warranty || '');
      setCompliance(product.compliance || '');

      setMoq(product.moq ? product.moq.toString() : '5');
      setPaymentTerms(product.paymentTerms || '');
      setDeliveryTerms(product.deliveryTerms || '');
      setSupportWhatsapp(product.supportWhatsapp || '');
      setSupportPhone(product.supportPhone || '');
      setSupportEmail(product.supportEmail || '');
      setSeoTitle(product.seoTitle || '');
      setSeoDescription(product.seoDescription || '');
    } else {
      setName('');
      setBrand('');
      setCategoryId('');
      setCategoryName('');
      setCategoryPath('');
      const genSku = `ND-${Math.floor(10000 + Math.random() * 90000)}`;
      setSku(genSku);
      setSlug(`product-${genSku.toLowerCase()}`);
      setImageUrl('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80');
      setDescription('');
      setStatus('active');

      setProductColors([
        { name: 'Midnight Black', hexCode: '#000000' },
        { name: 'Silver White', hexCode: '#E5E5EA' },
      ]);
      setProductSizes([
        { name: 'Standard Unit', abbreviation: 'STD' },
      ]);
      setMaterialsList([]);
      setPrimaryMaterial('Polymer & Aerospace Aluminum');
      setDenier('');

      setSrp('750000');
      setPriceTiers([
        { minQuantity: 1, price: 750000 },
        { minQuantity: 5, price: 680000 },
      ]);
      setMediaUrls([]);

      setHsCode('8517.62.00');
      setUnbsNumber('UNBS/QMS/2026');
      setWeight('0.45 KG');
      setVolumeCbm('0.002 CBM');
      setOriginCountry('China');
      setStockQuantity('150');
      setLeadTimeDays('2');
      setWarehouseLoc('Kampala Central Industrial Area');
      setPackaging('Master Export Carton (24 pcs)');
      setWarranty('1 Year Official Manufacturer Warranty');
      setCompliance('UNBS Certified • CE • RoHS');

      setMoq('5');
      setPaymentTerms('30% Downpayment on Order, 70% upon delivery inspection');
      setDeliveryTerms('Direct Warehouse Pickup or Regional Courier Dispatch');
      setSupportWhatsapp('+256 700 123456');
      setSupportPhone('+256 700 123456');
      setSupportEmail('procurement@apexwholesale.ug');
      setSeoTitle('');
      setSeoDescription('');
    }
    setActiveSection('identity');
    setIsFullScreen(false);
  }, [product, visible]);

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) return;
    const hex = customColorHex.trim().startsWith('#') ? customColorHex.trim() : `#${customColorHex.trim()}`;
    setProductColors([...productColors, { name: customColorName.trim(), hexCode: hex }]);
    setCustomColorName('');
  };

  const handleRemoveColor = (index: number) => {
    setProductColors((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Handlers: Sizes ---
  const handleAddPresetSize = (s: { name: string; abbreviation: string }) => {
    if (!productSizes.some((x) => x.abbreviation.toLowerCase() === s.abbreviation.toLowerCase())) {
      setProductSizes([...productSizes, s]);
    }
  };

  const handleAddCustomSize = () => {
    if (!customSizeName.trim()) return;
    const abbr = customSizeAbbr.trim() || customSizeName.trim().slice(0, 4).toUpperCase();
    setProductSizes([...productSizes, { name: customSizeName.trim(), abbreviation: abbr }]);
    setCustomSizeName('');
    setCustomSizeAbbr('');
  };

  const handleRemoveSize = (index: number) => {
    setProductSizes((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Handlers: Materials ---
  const handleAddMaterial = () => {
    if (!customMaterialName.trim()) return;
    setMaterialsList([...materialsList, { name: customMaterialName.trim() }]);
    setCustomMaterialName('');
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterialsList((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Handlers: Price Tiers ---
  const handleAddTier = () => {
    const qty = parseInt(newTierQty.replace(/[^0-9]/g, ''), 10);
    const price = parseInt(newTierPrice.replace(/[^0-9]/g, ''), 10);
    if (!qty || !price) return;
    const updated = [...priceTiers, { minQuantity: qty, price }].sort(
      (a, b) => a.minQuantity - b.minQuantity
    );
    setPriceTiers(updated);
    setNewTierQty('');
    setNewTierPrice('');
  };

  const handleRemoveTier = (index: number) => {
    setPriceTiers((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Handlers: Media & Image Picker ---
  const handlePickPrimaryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUrl(asset.uri);
        if (asset.base64) {
          setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
        }

        // Try standalone upload to Cloudflare R2
        setIsUploadingImage(true);
        try {
          const uploadRes = await ProductApiService.uploadImage({
            uri: asset.uri,
            name: asset.fileName || 'product.jpg',
            type: asset.mimeType || 'image/jpeg',
          });
          if (uploadRes?.url) {
            setImageUrl(uploadRes.url);
            showSuccess('Image Uploaded', 'Primary image saved to Cloudflare R2.');
          }
        } catch (uploadErr: any) {
          console.warn('R2 direct upload fallback to base64 payload:', uploadErr.message);
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.warn('Image picker error:', error);
    }
  };

  const handlePickGalleryImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          try {
            const uploadRes = await ProductApiService.uploadImage({
              uri: asset.uri,
              name: asset.fileName || 'gallery.jpg',
              type: asset.mimeType || 'image/jpeg',
            });
            if (uploadRes?.url) {
              setMediaUrls((prev) => [...prev, uploadRes.url]);
            } else {
              setMediaUrls((prev) => [...prev, asset.uri]);
            }
          } catch {
            setMediaUrls((prev) => [...prev, asset.uri]);
          }
        }
      }
    } catch (error) {
      console.warn('Gallery image picker error:', error);
    }
  };

  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
    setNewMediaUrl('');
  };

  const handleRemoveMediaUrl = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Save / Publish Product ---
  const handleSave = async () => {
    if (!name.trim()) {
      showError('Required Field', 'Please enter a Product Name before publishing.');
      return;
    }
    if (!brand.trim()) {
      showError('Required Field', 'Please enter a Brand Name.');
      return;
    }
    if (!categoryId) {
      showError('Category Required', 'Please choose or create a product category branch.');
      return;
    }

    const numericSrp = parseInt(srp.replace(/[^0-9]/g, ''), 10) || 0;
    if (numericSrp <= 0) {
      showError('Invalid Price', 'Please enter a valid wholesale unit price (SRP).');
      return;
    }

    // Automatically bind the current supplier from logged-in account (as in Dart project)
    const activeSupplierId = user?.id || '924fd9e2-25b5-4147-bb45-fbc3e4a8e785';
    const activeSupplierName = user?.legalBusinessName || user?.name || 'Apex Wholesale Importers';

    const numericStock = parseInt(stockQuantity.replace(/[^0-9]/g, ''), 10) || 50;
    const numericMoq = parseInt(moq.replace(/[^0-9]/g, ''), 10) || 1;
    const finalTiers = priceTiers.length > 0 ? priceTiers : [{ minQuantity: 1, price: numericSrp }];
    const finalImage = imageUrl.trim() || product?.imageUrl || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800';

    setIsSaving(true);
    try {
      const payload: Partial<Product> = {
        name: name.trim(),
        brand: brand.trim(),
        categoryId: categoryId,
        categoryName: categoryName.trim() || 'General Wholesale',
        supplierId: activeSupplierId,
        supplierName: activeSupplierName,
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        warehouseLoc: warehouseLoc.trim() || 'Kampala Central',
        srp: numericSrp,
        stockQuantity: numericStock,
        moq: numericMoq,
        moqText: `${numericMoq} units min order`,
        description: description.trim(),
        imageUrl: finalImage,
        status,
        colors: productColors,
        sizes: productSizes,
        materialsList,
        material: primaryMaterial.trim(),
        denier: denier.trim(),
        hsCode: hsCode.trim(),
        unbsNumber: unbsNumber.trim(),
        weight: weight.trim(),
        volumeCbm: volumeCbm.trim(),
        originCountry: originCountry.trim() || 'Uganda',
        leadTimeDays: leadTimeDays.trim(),
        packaging: packaging.trim(),
        warranty: warranty.trim(),
        compliance: compliance.trim(),
        paymentTerms: paymentTerms.trim(),
        deliveryTerms: deliveryTerms.trim(),
        supportPhone: supportPhone.trim(),
        supportWhatsapp: supportWhatsapp.trim(),
        supportEmail: supportEmail.trim(),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        priceTiers: finalTiers,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : [finalImage],
        imageBase64: imageBase64 || undefined,
      };

      if (isEditing && product) {
        await updateProduct(product.id, payload);
        showSuccess('Product Updated', `"${payload.name}" has been updated successfully.`);
      } else {
        await publishProduct({
          ...payload as any,
          supplierId: activeSupplierId,
          supplierName: activeSupplierName,
        });
        showSuccess('Product Published', `"${payload.name}" is now live in your catalog.`);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showError('Publish Failed', err.message || 'Could not complete publishing.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!product) return;
    const confirmAction = () => {
      deleteProduct(product.id);
      showSuccess('Product Removed', `"${product.name}" was removed from your catalog.`);
      onClose();
      if (onSuccess) onSuccess();
    };

    if (Platform.OS === 'web') {
      if (window.confirm?.(`Are you sure you want to permanently delete "${product.name}"?`)) {
        confirmAction();
      }
    } else {
      Alert.alert('Delete Listing', `Permanently remove "${product.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmAction },
      ]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            isDesktop && styles.sheetContainerDesktop,
            isFullScreen && styles.sheetContainerFullScreen,
            { backgroundColor: isDark ? '#1C1C21' : '#FFFFFF' },
          ]}
        >
          {/* Mobile Handlebar */}
          {!isDesktop && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsFullScreen((prev) => !prev)}
              style={styles.handlebarTouchArea}
            >
              <View
                style={[
                  styles.handlebar,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' },
                ]}
              />
            </TouchableOpacity>
          )}

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.onSurface }]}>
                {isEditing ? 'Update Wholesale Product' : 'Post Wholesale Product'}
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>
                {isEditing ? `Editing SKU: ${sku || product?.id}` : 'Complete multi-spec form matching N.O.D.E wholesale distribution protocol'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {/* Expand / Minimize toggle button */}
              <TouchableOpacity
                onPress={() => setIsFullScreen((prev) => !prev)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
              >
                <MaterialIcon
                  name={isFullScreen ? 'fullscreen_exit' : 'fullscreen'}
                  size={22}
                  color={colors.onSurfaceMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.closeBtn}>
                <MaterialIcon name="close" size={22} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Navigation Tabs (All 5 Sections from Dart Spec) */}
          <View style={[styles.sectionTabsRow, { borderBottomColor: colors.borderLight }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
              {[
                { key: 'identity' as ActiveSection, label: 'Identity', icon: 'package_2' },
                { key: 'variants' as ActiveSection, label: 'Colors & Sizes', icon: 'palette' },
                { key: 'pricing' as ActiveSection, label: 'Wholesale Tiers', icon: 'payments' },
                { key: 'logistics' as ActiveSection, label: 'Logistics & Stock', icon: 'local_shipping' },
                { key: 'support' as ActiveSection, label: 'Terms & Support', icon: 'verified_user' },
              ].map((tab) => {
                const isSelected = activeSection === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveSection(tab.key)}
                    style={[
                      styles.sectionTabBtn,
                      isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 },
                    ]}
                  >
                    <MaterialIcon
                      name={tab.icon}
                      size={16}
                      color={isSelected ? colors.primary : colors.onSurfaceMuted}
                    />
                    <Text
                      style={[
                        styles.sectionTabText,
                        { color: isSelected ? colors.primary : colors.onSurfaceMuted },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Main Scroll Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              if (y > 30 && !isFullScreen) {
                setIsFullScreen(true);
              }
            }}
          >

            {/* ═══════════════════════════════════════════════════
                SECTION 1: BASIC IDENTITY
               ═══════════════════════════════════════════════════ */}
            {activeSection === 'identity' && (
              <View>
                {/* Image Preview & URL */}
                <View style={styles.imagePreviewRow}>
                  <TouchableOpacity
                    onPress={handlePickPrimaryImage}
                    activeOpacity={0.7}
                    style={[
                      styles.imageThumbnailBox,
                      {
                        backgroundColor: isDark ? colors.cardColor : '#F0F2F5',
                        borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    {imageUrl ? (
                      <>
                        <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                        {isUploadingImage && (
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          </View>
                        )}
                      </>
                    ) : isUploadingImage ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcon name="add_a_photo" size={28} color={colors.primary} />
                        <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Pick Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.imageUrlInputCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Primary Product Image *</Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={handlePickPrimaryImage}
                        style={[
                          styles.addBtnSmall,
                          {
                            backgroundColor: colors.primary,
                            flexDirection: 'row',
                            gap: 6,
                            paddingHorizontal: 16,
                          },
                        ]}
                      >
                        <MaterialIcon name="photo_camera" size={18} color="#FFFFFF" />
                        <Text style={styles.addBtnSmallText}>{imageUrl ? 'Change Image' : 'Pick Image'}</Text>
                      </TouchableOpacity>
                      {imageUrl ? (
                        <TouchableOpacity
                          onPress={() => setImageUrl('')}
                          style={[
                            styles.addBtnSmall,
                            {
                              backgroundColor: 'rgba(255, 77, 79, 0.12)',
                              paddingHorizontal: 12,
                            },
                          ]}
                        >
                          <MaterialIcon name="delete_outline" size={18} color="#FF4D4F" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)', marginTop: 6 }]}>
                      Pick from device camera roll or gallery.
                    </Text>
                  </View>
                </View>

                {/* Product Name */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Product Name *</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <MaterialIcon name="label" size={18} color={colors.onSurfaceMuted} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. 100W Solar Kit / Industrial Rice Cooker"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* SKU & Brand */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>SKU / Unique ID</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={sku}
                        onChangeText={setSku}
                        placeholder="SKU-001-ADMIN"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Brand Name</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={brand}
                        onChangeText={setBrand}
                        placeholder="e.g. Eagle Brand / Prime Tools"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* SEO Slug & Category */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>SEO Slug (URL Handle)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={slug}
                        onChangeText={setSlug}
                        placeholder="product-slug-url"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={[styles.fieldLabel, { color: colors.onSurface, marginBottom: 0 }]}>Category & Branch *</Text>
                      <TouchableOpacity onPress={() => setIsCategoryPickerOpen(true)}>
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>Browse Tree</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setIsCategoryPickerOpen(true)}
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: isDark ? colors.cardColor : '#F6F8FA',
                          borderColor: categoryId ? colors.primary : (isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)'),
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          gap: 8,
                          height: 44,
                        },
                      ]}
                    >
                      <MaterialIcon
                        name={categoryId ? 'folder_open' : 'add_circle_outline'}
                        size={18}
                        color={categoryId ? colors.primary : colors.onSurfaceMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 13,
                            fontWeight: categoryId ? '600' : '400',
                            color: categoryId ? colors.onSurface : (isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'),
                          }}
                        >
                          {categoryPath || categoryName || 'Choose or Create Category...'}
                        </Text>
                      </View>
                      <MaterialIcon name="chevron_right" size={18} color={colors.onSurfaceMuted} />
                    </TouchableOpacity>
                    {categoryPath ? (
                      <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4, fontWeight: '600' }}>
                        Branch: {categoryPath}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Detailed Specifications & Overview</Text>
                  <View style={[styles.textAreaWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      placeholder="Comprehensive product description, key application scenarios, commercial grade..."
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.textAreaField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Listing Status */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Listing Status</Text>
                  <View style={styles.statusButtonsRow}>
                    {(['active', 'low_stock', 'draft'] as const).map((st) => (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setStatus(st)}
                        style={[
                          styles.statusBtn,
                          {
                            backgroundColor: status === st ? colors.primary : (isDark ? colors.cardColor : '#F3F4F6'),
                            borderColor: status === st ? colors.primary : (isDark ? colors.borderLight : 'rgba(0,0,0,0.08)'),
                          },
                        ]}
                      >
                        <Text style={[styles.statusBtnText, { color: status === st ? '#FFFFFF' : colors.onSurface }]}>
                          {st === 'active' ? '● Active' : st === 'low_stock' ? '▲ Low Stock' : 'Draft'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ═══════════════════════════════════════════════════
                SECTION 2: VARIANTS & ATTRIBUTES (COLORS, SIZES, MATERIALS)
               ═══════════════════════════════════════════════════ */}
            {activeSection === 'variants' && (
              <View>
                {/* 🎨 ALL COLORS IN THE WORLD PALETTE & SEARCH */}
                <View style={styles.formGroup}>
                  <View style={styles.sectionHeaderLine}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                      Available Colors ({productColors.length} Selected)
                    </Text>
                  </View>
                  <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' }]}>
                    Use the visual color picker to pick any color, write the color name, and click Add.
                  </Text>

                  {/* Active Selected Colors */}
                  {productColors.length > 0 ? (
                    <View style={styles.chipWrapRow}>
                      {productColors.map((col, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.variantChip,
                            {
                              backgroundColor: isDark ? colors.cardColor : '#F3F4F6',
                              borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.08)',
                            },
                          ]}
                        >
                          <View style={[styles.colorSwatchCircle, { backgroundColor: col.hexCode }]} />
                          <Text style={[styles.variantChipText, { color: colors.onSurface }]}>
                            {col.name} ({col.hexCode})
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveColor(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcon name="close" size={14} color={colors.onSurfaceMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyVariantNotice, { color: colors.onSurfaceMuted }]}>
                      No colors assigned yet. Pick from the global catalog below or type custom details.
                    </Text>
                  )}

                  {/* Visual Color Picker & Name Input */}
                  <View style={styles.customAddCard}>
                    <Text style={[styles.subLabel, { color: colors.onSurface }]}>Pick Color & Enter Name</Text>
                    <View style={styles.customAddRow}>
                      {/* Interactive Visual Color Picker */}
                      {Platform.OS === 'web' ? (
                        <View style={styles.colorPickerWrapper}>
                          <input
                            type="color"
                            value={customColorHex}
                            onChange={(e: any) => setCustomColorHex(e.target.value)}
                            style={{
                              width: 44,
                              height: 44,
                              padding: 0,
                              border: `2px solid ${colors.borderLight}`,
                              borderRadius: 12,
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                            }}
                          />
                        </View>
                      ) : (
                        <View style={[styles.colorPreviewBox, { backgroundColor: customColorHex }]}>
                          <MaterialIcon name="palette" size={20} color="#FFFFFF" />
                        </View>
                      )}

                      <View style={[styles.inputWrapper, { flex: 2, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customColorName}
                          onChangeText={setCustomColorName}
                          placeholder="Color Name (e.g. Royal Blue, Crimson, Gold)..."
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>

                      <View style={[styles.inputWrapper, { flex: 1, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customColorHex}
                          onChangeText={setCustomColorHex}
                          placeholder="#12BBF0"
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>

                      <TouchableOpacity onPress={handleAddCustomColor} style={[styles.addBtnSmall, { backgroundColor: colors.primary }]}>
                        <MaterialIcon name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.addBtnSmallText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* 📏 SIZES & DIMENSIONS (APPAREL, SHOES, TECH, PACKS) */}
                <View style={styles.formGroup}>
                  <View style={styles.sectionHeaderLine}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                      Available Sizes & Dimensions ({productSizes.length} Selected)
                    </Text>
                  </View>
                  <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' }]}>
                    Select presets or enter your own custom sizes and measurements.
                  </Text>

                  {/* Active Selected Sizes */}
                  {productSizes.length > 0 ? (
                    <View style={styles.chipWrapRow}>
                      {productSizes.map((sz, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.variantChip,
                            {
                              backgroundColor: isDark ? colors.cardColor : '#F3F4F6',
                              borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.08)',
                            },
                          ]}
                        >
                          <View style={[styles.sizeAbbrBadge, { backgroundColor: colors.primary + '22' }]}>
                            <Text style={[styles.sizeAbbrText, { color: colors.primary }]}>
                              {sz.abbreviation}
                            </Text>
                          </View>
                          <Text style={[styles.variantChipText, { color: colors.onSurface }]}>
                            {sz.name}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveSize(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcon name="close" size={14} color={colors.onSurfaceMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyVariantNotice, { color: colors.onSurfaceMuted }]}>
                      No sizes assigned. Pick from categories below or type custom figures.
                    </Text>
                  )}

                  {/* Tech Capacity / Memory Sizes */}
                  <Text style={[styles.subLabel, { color: colors.onSurface }]}>💾 Tech Storage & Memory</Text>
                  <View style={styles.presetPaletteRow}>
                    {SIZE_PRESETS_CATALOG.storage.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => handleAddPresetSize(preset)}
                        style={[
                          styles.presetColorBtn,
                          {
                            backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                            borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.1)',
                          },
                        ]}
                      >
                        <Text style={[styles.presetName, { color: colors.onSurface, fontWeight: '700' }]}>
                          {preset.abbreviation}
                        </Text>
                        <MaterialIcon name="add" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Apparel & Garment Sizes */}
                  <Text style={[styles.subLabel, { color: colors.onSurface }]}>👕 Apparel / Clothing Sizes</Text>
                  <View style={styles.presetPaletteRow}>
                    {SIZE_PRESETS_CATALOG.apparel.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => handleAddPresetSize(preset)}
                        style={[
                          styles.presetColorBtn,
                          {
                            backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                            borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.1)',
                          },
                        ]}
                      >
                        <Text style={[styles.presetName, { color: colors.onSurface, fontWeight: '700' }]}>
                          {preset.abbreviation}
                        </Text>
                        <MaterialIcon name="add" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Footwear / Shoe Sizes */}
                  <Text style={[styles.subLabel, { color: colors.onSurface }]}>👟 Footwear Sizes (EU / US)</Text>
                  <View style={styles.presetPaletteRow}>
                    {SIZE_PRESETS_CATALOG.shoes.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => handleAddPresetSize(preset)}
                        style={[
                          styles.presetColorBtn,
                          {
                            backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                            borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.1)',
                          },
                        ]}
                      >
                        <Text style={[styles.presetName, { color: colors.onSurface, fontWeight: '700' }]}>
                          {preset.abbreviation}
                        </Text>
                        <MaterialIcon name="add" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Custom Size / Figures Input */}
                  <View style={styles.customAddCard}>
                    <Text style={[styles.subLabel, { color: colors.onSurface }]}>Write Custom Size & Figures</Text>
                    <View style={styles.customAddRow}>
                      <View style={[styles.inputWrapper, { flex: 1.5, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customSizeName}
                          onChangeText={setCustomSizeName}
                          placeholder="Size Name (e.g. 500 Liters / 30 x 40 cm)"
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>
                      <View style={[styles.inputWrapper, { flex: 1, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customSizeAbbr}
                          onChangeText={setCustomSizeAbbr}
                          placeholder="Short Code (e.g. 500L)"
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>
                      <TouchableOpacity onPress={handleAddCustomSize} style={[styles.addBtnSmall, { backgroundColor: colors.primary }]}>
                        <MaterialIcon name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.addBtnSmallText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* 🧵 MATERIALS & TEXTILES (DENIER, MATERIAL LIST) */}
                <View style={styles.formGroup}>
                  <View style={styles.sectionHeaderLine}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                      Materials & Denier
                    </Text>
                  </View>
                  <View style={styles.twoColRow}>
                    <View style={styles.halfCol}>
                      <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Primary Material</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={primaryMaterial}
                          onChangeText={setPrimaryMaterial}
                          placeholder="e.g. 100% Polyester / Aluminium"
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>
                    </View>
                    <View style={styles.halfCol}>
                      <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Denier (Textiles / Fabric)</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={denier}
                          onChangeText={setDenier}
                          placeholder="e.g. 210D / 600D Oxford"
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Materials list chips */}
                  {materialsList.length > 0 && (
                    <View style={[styles.chipWrapRow, { marginTop: 10 }]}>
                      {materialsList.map((m, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.variantChip,
                            {
                              backgroundColor: isDark ? colors.cardColor : '#F3F4F6',
                              borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.08)',
                            },
                          ]}
                        >
                          <MaterialIcon name="texture" size={14} color={colors.primary} />
                          <Text style={[styles.variantChipText, { color: colors.onSurface }]}>
                            {m.name}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveMaterial(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcon name="close" size={14} color={colors.onSurfaceMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.customAddRow}>
                    <View style={[styles.inputWrapper, { flex: 1, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={customMaterialName}
                        onChangeText={setCustomMaterialName}
                        placeholder="Add another material component (e.g. Carbon Fiber)"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                    <TouchableOpacity onPress={handleAddMaterial} style={[styles.addBtnSmall, { backgroundColor: colors.primary }]}>
                      <MaterialIcon name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.addBtnSmallText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ═══════════════════════════════════════════════════
                SECTION 3: WHOLESALE & PRICING
               ═══════════════════════════════════════════════════ */}
            {activeSection === 'pricing' && (
              <View>
                {/* Retail Price SRP */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Retail Price (UGX) *</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <MaterialIcon name="account_balance_wallet" size={18} color={colors.onSurfaceMuted} />
                    <TextInput
                      value={srp}
                      onChangeText={setSrp}
                      placeholder="0.00"
                      keyboardType="numeric"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Wholesale Price Tiers */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Wholesale Price Tiers ({priceTiers.length})</Text>
                  <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' }]}>
                    Buyers purchasing above the tier quantity get the discounted rate.
                  </Text>

                  {priceTiers.map((tier, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tierRow,
                        {
                          backgroundColor: isDark ? colors.cardColor : '#F8F9FA',
                          borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View style={styles.tierInfo}>
                        <View style={[styles.tierBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.tierQty, { color: colors.primary }]}>{tier.minQuantity}+ units</Text>
                        </View>
                        <Text style={[styles.tierPrice, { color: colors.onSurface }]}>
                          UGX {tier.price.toLocaleString()} / unit
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveTier(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialIcon name="delete_outline" size={18} color="#FF4D4F" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add New Tier */}
                  <View style={styles.addTierRow}>
                    <View style={[styles.addTierInputBox, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={newTierQty}
                        onChangeText={setNewTierQty}
                        placeholder="Min Qty (e.g. 10)"
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                    <View style={[styles.addTierInputBox, { flex: 1.5, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={newTierPrice}
                        onChangeText={setNewTierPrice}
                        placeholder="Discounted UGX / Unit"
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                    <TouchableOpacity onPress={handleAddTier} style={[styles.addTierBtn, { backgroundColor: colors.primary }]}>
                      <MaterialIcon name="add" size={18} color="#FFFFFF" />
                      <Text style={styles.addTierBtnText}>Add Tier</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Product Media Gallery Photos */}
                <View style={styles.formGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface, marginBottom: 0 }]}>
                      Product Gallery Photos ({mediaUrls.length})
                    </Text>
                    <TouchableOpacity
                      onPress={handlePickGalleryImages}
                      style={[
                        styles.addBtnSmall,
                        {
                          backgroundColor: colors.primary,
                          height: 36,
                          paddingHorizontal: 12,
                        },
                      ]}
                    >
                      <MaterialIcon name="add_photo_alternate" size={16} color="#FFFFFF" />
                      <Text style={[styles.addBtnSmallText, { fontSize: 11 }]}>Pick Images</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)', marginBottom: 8 }]}>
                    Upload multiple high-resolution photos of packaging, angles, or batch units.
                  </Text>

                  {/* Thumbnails grid */}
                  {mediaUrls.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                      {mediaUrls.map((url, idx) => (
                        <View
                          key={idx}
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 10,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.1)',
                            position: 'relative',
                          }}
                        >
                          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          <TouchableOpacity
                            onPress={() => handleRemoveMediaUrl(idx)}
                            style={{
                              position: 'absolute',
                              top: 3,
                              right: 3,
                              backgroundColor: 'rgba(0,0,0,0.65)',
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MaterialIcon name="close" size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Fallback URL input */}
                  <View style={styles.addMediaRow}>
                    <View style={[styles.inputWrapper, { flex: 1, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={newMediaUrl}
                        onChangeText={setNewMediaUrl}
                        placeholder="Or paste external image URL..."
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                    <TouchableOpacity onPress={handleAddMediaUrl} style={[styles.addTierBtn, { backgroundColor: colors.cardColor, borderWidth: 1, borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.1)' }]}>
                      <MaterialIcon name="add" size={16} color={colors.onSurface} />
                      <Text style={[styles.addTierBtnText, { color: colors.onSurface }]}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ═══════════════════════════════════════════════════
                SECTION 4: LOGISTICS, COMPLIANCE & STORAGE
               ═══════════════════════════════════════════════════ */}
            {activeSection === 'logistics' && (
              <View>
                {/* HS Code & UNBS # */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>HS Code</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={hsCode}
                        onChangeText={setHsCode}
                        placeholder="e.g. 8504.40.95"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>UNBS Certificate #</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={unbsNumber}
                        onChangeText={setUnbsNumber}
                        placeholder="e.g. UNBS/QMS/2026/89"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Weight & Volume */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Weight (KG)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="0.0 KG"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Volume (CBM)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={volumeCbm}
                        onChangeText={setVolumeCbm}
                        placeholder="0.0 CBM"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Origin & Current Stock */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Origin Country</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={originCountry}
                        onChangeText={setOriginCountry}
                        placeholder="e.g. China / Uganda / Kenya"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Current Warehouse Stock</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={stockQuantity}
                        onChangeText={setStockQuantity}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Lead Time & Warehouse Location */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Lead Time (Days)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={leadTimeDays}
                        onChangeText={setLeadTimeDays}
                        placeholder="e.g. 2"
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Warehouse Location</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <MaterialIcon name="place" size={18} color={colors.primary} />
                      <TextInput
                        value={warehouseLoc}
                        onChangeText={setWarehouseLoc}
                        placeholder="e.g. Kampala Hub A"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Packaging & Warranty */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Packaging Format</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={packaging}
                        onChangeText={setPackaging}
                        placeholder="e.g. Commercial Bulk Carton (24 pcs)"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Warranty Period</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={warranty}
                        onChangeText={setWarranty}
                        placeholder="e.g. 1 Year Official Warranty"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ═══════════════════════════════════════════════════
                SECTION 5: TRADING TERMS, SUPPORT & SEO
               ═══════════════════════════════════════════════════ */}
            {activeSection === 'support' && (
              <View>
                {/* MOQ */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>MOQ (Minimum Order Quantity)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <MaterialIcon name="shopping_bag" size={18} color={colors.primary} />
                    <TextInput
                      value={moq}
                      onChangeText={setMoq}
                      placeholder="e.g. 5 units"
                      keyboardType="numeric"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Payment Terms */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Payment Terms</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={paymentTerms}
                      onChangeText={setPaymentTerms}
                      placeholder="e.g. 30% Downpayment, 70% before delivery dispatch"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Delivery Terms */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Delivery Terms</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={deliveryTerms}
                      onChangeText={setDeliveryTerms}
                      placeholder="e.g. FOB Kampala or Direct Commercial Pallet Courier"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Support Channels: WhatsApp & Phone */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Support WhatsApp</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <MaterialIcon name="chat" size={18} color="#25D366" />
                      <TextInput
                        value={supportWhatsapp}
                        onChangeText={setSupportWhatsapp}
                        placeholder="+256 700 123456"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Support Phone</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <MaterialIcon name="phone" size={18} color={colors.primary} />
                      <TextInput
                        value={supportPhone}
                        onChangeText={setSupportPhone}
                        placeholder="+256 700 123456"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Support Email */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Support Email</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <MaterialIcon name="mail" size={18} color={colors.onSurfaceMuted} />
                    <TextInput
                      value={supportEmail}
                      onChangeText={setSupportEmail}
                      placeholder="procurement@supplier.ug"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* SEO Meta Title & Description */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>SEO Meta Title</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={seoTitle}
                      onChangeText={setSeoTitle}
                      placeholder="Meta Title for Google & Search Engines"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>SEO Meta Description</Text>
                  <View style={[styles.textAreaWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={seoDescription}
                      onChangeText={setSeoDescription}
                      multiline
                      numberOfLines={3}
                      placeholder="Short SEO snippet for catalog indexing..."
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.textAreaField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 24 }} />

            {/* Action Buttons */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={isSaving}
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary, opacity: isSaving ? 0.75 : 1 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcon name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Save All Changes' : 'Publish Product to Catalog'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleDelete} style={styles.deleteButton}>
                <MaterialIcon name="delete" size={18} color="#FF4D4F" />
                <Text style={styles.deleteButtonText}>Delete Product Listing</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>

      <CategoryBranchPicker
        visible={isCategoryPickerOpen}
        selectedCategoryId={categoryId}
        onSelect={(res: CategorySelectionResult) => {
          setCategoryId(res.id);
          setCategoryName(res.name);
          setCategoryPath(res.fullPath);
        }}
        onClose={() => setIsCategoryPickerOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '92%',
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 24,
    zIndex: 1,
    transitionProperty: 'all',
    transitionDuration: '280ms',
  } as any,
  sheetContainerDesktop: {
    borderRadius: 24,
    maxHeight: '88%',
    maxWidth: 780,
    paddingTop: 22,
    paddingBottom: 16,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
  },
  sheetContainerFullScreen: {
    maxHeight: '100%',
    height: '100%',
    maxWidth: '100%',
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: Platform.OS === 'web' ? 16 : 44,
  },
  handlebarTouchArea: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  handlebar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sectionTabsRow: {
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sectionTabText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageThumbnailBox: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageUrlInputCol: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
  },
  fieldHelper: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 10,
    lineHeight: 16,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    height: '100%',
    outlineStyle: 'none' as any,
  },
  textAreaWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  textAreaField: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    minHeight: 80,
    textAlignVertical: 'top',
    outlineStyle: 'none' as any,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfCol: {
    flex: 1,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },

  // Color & Size Chips
  chipWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  colorSwatchCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  variantChipText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  emptyVariantNotice: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontStyle: 'italic',
    marginBottom: 8,
  },

  // Color Picker & Swatches
  colorPickerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreviewBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Presets Row
  presetPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetColorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetName: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Custom Add Cards
  customAddCard: {
    marginTop: 8,
  },
  customAddRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },

  // Size Badge
  sizeAbbrBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizeAbbrText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
  },

  // Tiers
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierQty: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  tierPrice: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  addTierRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  addTierInputBox: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addTierBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },

  // Media URLs
  mediaUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  miniMediaThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  miniMediaUrlText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  addMediaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },

  // Save / Delete Buttons
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    marginTop: 8,
    backgroundColor: 'rgba(255, 77, 79, 0.08)',
  },
  deleteButtonText: {
    color: '#FF4D4F',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
});
