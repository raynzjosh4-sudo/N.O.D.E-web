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
} from 'react-native';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { Product, PriceTier, ProductColor, ProductSize } from '../../domain/entities/product';
import { useProducts } from '../../context/products_context';

interface EditProductSheetProps {
  visible: boolean;
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// Quick Preset Colors
const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Midnight Black', hex: '#000000' },
  { name: 'Space Gray', hex: '#3A3A3C' },
  { name: 'Silver White', hex: '#F0F0F2' },
  { name: 'Midnight Blue', hex: '#1A2A44' },
  { name: 'Enterprise Blue', hex: '#12BBF0' },
  { name: 'Forest Green', hex: '#1E4620' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Gold / Amber', hex: '#F59E0B' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Rose', hex: '#EC4899' },
  { name: 'Sand Khaki', hex: '#C2B280' },
];

// Quick Preset Size Groups
const SIZE_PRESETS = {
  apparel: [
    { name: 'Extra Small', abbreviation: 'XS' },
    { name: 'Small', abbreviation: 'S' },
    { name: 'Medium', abbreviation: 'M' },
    { name: 'Large', abbreviation: 'L' },
    { name: 'Extra Large', abbreviation: 'XL' },
    { name: '2X Large', abbreviation: '2XL' },
  ],
  storage: [
    { name: '64 GB', abbreviation: '64G' },
    { name: '128 GB', abbreviation: '128G' },
    { name: '256 GB', abbreviation: '256G' },
    { name: '512 GB', abbreviation: '512G' },
    { name: '1 Terabyte', abbreviation: '1TB' },
  ],
  screen: [
    { name: '11-inch', abbreviation: '11"' },
    { name: '13-inch', abbreviation: '13"' },
    { name: '14-inch', abbreviation: '14"' },
    { name: '15.6-inch', abbreviation: '15.6"' },
    { name: '16-inch', abbreviation: '16"' },
  ],
};

type ActiveSection = 'general' | 'variants' | 'pricing' | 'logistics';

export function EditProductSheet({
  visible,
  product,
  onClose,
  onSuccess,
}: EditProductSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { updateProduct, addProduct, deleteProduct } = useProducts();

  const isEditing = Boolean(product);

  const [activeSection, setActiveSection] = useState<ActiveSection>('general');

  // General Identity
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [sku, setSku] = useState('');
  const [warehouseLoc, setWarehouseLoc] = useState('');
  const [srp, setSrp] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [moq, setMoq] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'low_stock' | 'draft'>('active');

  // Colors & Sizes
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#12BBF0');
  const [customSizeName, setCustomSizeName] = useState('');
  const [customSizeAbbr, setCustomSizeAbbr] = useState('');

  // Logistics & Attributes
  const [material, setMaterial] = useState('');
  const [packaging, setPackaging] = useState('');
  const [weight, setWeight] = useState('');
  const [warranty, setWarranty] = useState('');
  const [compliance, setCompliance] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');

  // Tiered Pricing
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [newTierQty, setNewTierQty] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');

  // Media Gallery URLs
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setBrand(product.brand || '');
      setCategoryName(product.categoryName || 'Electronics & Gadgets');
      setSku(product.sku || '');
      setWarehouseLoc(product.warehouseLoc || 'Kampala Central');
      setSrp(product.srp ? product.srp.toString() : '');
      setStockQuantity(product.stockQuantity !== undefined ? product.stockQuantity.toString() : '100');
      setMoq(product.moq ? product.moq.toString() : '1');
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      setStatus((product.status as any) || 'active');
      setProductColors(product.colors ? [...product.colors] : []);
      setProductSizes(product.sizes ? [...product.sizes] : []);
      setMaterial(product.material || '');
      setPackaging(product.packaging || '');
      setWeight(product.weight || '');
      setWarranty(product.warranty || '');
      setCompliance(product.compliance || '');
      setSupportPhone(product.supportPhone || '');
      setSupportWhatsapp(product.supportWhatsapp || '');
      setPriceTiers(product.priceTiers ? [...product.priceTiers] : []);
      setMediaUrls(product.mediaUrls ? [...product.mediaUrls] : []);
    } else {
      setName('');
      setBrand('');
      setCategoryName('Electronics & Gadgets');
      setSku(`ND-${Math.floor(10000 + Math.random() * 90000)}`);
      setWarehouseLoc('Kampala Central Warehouse');
      setSrp('1000000');
      setStockQuantity('50');
      setMoq('5');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80');
      setStatus('active');
      setProductColors([
        { name: 'Space Gray', hexCode: '#3A3A3C' },
        { name: 'Silver', hexCode: '#E5E5EA' },
      ]);
      setProductSizes([
        { name: 'Standard Unit', abbreviation: 'STD' },
      ]);
      setMaterial('Aerospace Grade Aluminum & Polymer');
      setPackaging('Master Export Carton (12 units)');
      setWeight('500g / unit');
      setWarranty('1 Year Official Manufacturer Warranty');
      setCompliance('UNBS Certified • CE Approved');
      setSupportPhone('+256 700 123456');
      setSupportWhatsapp('+256 700 123456');
      setPriceTiers([
        { minQuantity: 1, price: 950000 },
        { minQuantity: 5, price: 850000 },
      ]);
      setMediaUrls([]);
    }
    setActiveSection('general');
  }, [product, visible]);

  // Color actions
  const handleAddPresetColor = (preset: { name: string; hex: string }) => {
    if (!productColors.some((c) => c.hexCode.toLowerCase() === preset.hex.toLowerCase())) {
      setProductColors([...productColors, { name: preset.name, hexCode: preset.hex }]);
    }
  };

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) return;
    const hex = customColorHex.trim().startsWith('#') ? customColorHex.trim() : `#${customColorHex.trim()}`;
    setProductColors([...productColors, { name: customColorName.trim(), hexCode: hex }]);
    setCustomColorName('');
  };

  const handleRemoveColor = (index: number) => {
    setProductColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Size actions
  const handleAddPresetSize = (preset: { name: string; abbreviation: string }) => {
    if (!productSizes.some((s) => s.abbreviation.toLowerCase() === preset.abbreviation.toLowerCase())) {
      setProductSizes([...productSizes, preset]);
    }
  };

  const handleAddCustomSize = () => {
    if (!customSizeName.trim()) return;
    const abbr = customSizeAbbr.trim() || customSizeName.trim().slice(0, 3).toUpperCase();
    setProductSizes([...productSizes, { name: customSizeName.trim(), abbreviation: abbr }]);
    setCustomSizeName('');
    setCustomSizeAbbr('');
  };

  const handleRemoveSize = (index: number) => {
    setProductSizes((prev) => prev.filter((_, i) => i !== index));
  };

  // Tier actions
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

  // Gallery actions
  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
    setNewMediaUrl('');
  };

  const handleRemoveMediaUrl = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Save handler
  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a product name.');
      } else {
        Alert.alert('Validation Error', 'Please enter a product name.');
      }
      return;
    }

    const numericSrp = parseInt(srp.replace(/[^0-9]/g, ''), 10) || 0;
    const numericStock = parseInt(stockQuantity.replace(/[^0-9]/g, ''), 10) || 0;
    const numericMoq = parseInt(moq.replace(/[^0-9]/g, ''), 10) || 1;
    const tiersToSave = priceTiers.length > 0 ? priceTiers : [{ minQuantity: 1, price: numericSrp }];

    const payload: Partial<Product> = {
      name: name.trim(),
      brand: brand.trim(),
      categoryName: categoryName.trim(),
      sku: sku.trim(),
      warehouseLoc: warehouseLoc.trim(),
      srp: numericSrp,
      stockQuantity: numericStock,
      moq: numericMoq,
      description: description.trim(),
      imageUrl: imageUrl.trim() || product?.imageUrl || '',
      status,
      colors: productColors,
      sizes: productSizes,
      material: material.trim(),
      packaging: packaging.trim(),
      weight: weight.trim(),
      warranty: warranty.trim(),
      compliance: compliance.trim(),
      supportPhone: supportPhone.trim(),
      supportWhatsapp: supportWhatsapp.trim(),
      priceTiers: tiersToSave,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : (imageUrl ? [imageUrl] : []),
    };

    if (isEditing && product) {
      updateProduct(product.id, payload);
    } else {
      addProduct({
        ...payload as any,
        supplierName: 'Apex Wholesale Importers',
      });
    }

    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleDelete = () => {
    if (!product) return;
    const confirmAction = () => {
      deleteProduct(product.id);
      onClose();
      if (onSuccess) onSuccess();
    };

    if (Platform.OS === 'web') {
      if (window.confirm?.(`Are you sure you want to delete "${product.name}"?`)) {
        confirmAction();
      }
    } else {
      Alert.alert('Delete Product', `Delete "${product.name}" from catalog?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmAction },
      ]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#1C1C21' : '#FFFFFF' }]}>
          {/* Handlebar */}
          <View
            style={[
              styles.handlebar,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' },
            ]}
          />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.onSurface }]}>
                {isEditing ? 'Update Wholesale Product' : 'Add Wholesale Product'}
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>
                {isEditing ? `Editing SKU: ${sku || product?.id}` : 'Create a new inventory listing with variants & tiered pricing'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.closeBtn}>
              <MaterialIcon name="close" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Section Navigation Tabs */}
          <View style={[styles.sectionTabsRow, { borderBottomColor: colors.borderLight }]}>
            {[
              { key: 'general' as ActiveSection, label: 'General & Specs', icon: 'info' },
              { key: 'variants' as ActiveSection, label: 'Colors & Sizes', icon: 'palette' },
              { key: 'pricing' as ActiveSection, label: 'Wholesale Tiers', icon: 'payments' },
              { key: 'logistics' as ActiveSection, label: 'Packaging & Support', icon: 'inventory_2' },
            ].map((tab) => {
              const isSelected = activeSection === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveSection(tab.key)}
                  style={[
                    styles.sectionTabBtn,
                    isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
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
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── 1. GENERAL IDENTITY & SPECS ── */}
            {activeSection === 'general' && (
              <View>
                {/* Image Preview & URL */}
                <View style={styles.imagePreviewRow}>
                  <View
                    style={[
                      styles.imageThumbnailBox,
                      {
                        backgroundColor: isDark ? colors.cardColor : '#F0F2F5',
                        borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                      <MaterialIcon name="image" size={32} color={colors.onSurfaceMuted} />
                    )}
                  </View>
                  <View style={styles.imageUrlInputCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Primary Product Image URL</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: isDark ? colors.cardColor : '#F6F8FA',
                          borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                    >
                      <TextInput
                        value={imageUrl}
                        onChangeText={setImageUrl}
                        placeholder="https://..."
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Product Name */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Product Name *</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Apple iPad Air 11-inch M2 Chip"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Brand & Category */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Brand</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={brand}
                        onChangeText={setBrand}
                        placeholder="e.g. Apple"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Category</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={categoryName}
                        onChangeText={setCategoryName}
                        placeholder="e.g. Electronics & Gadgets"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* SKU & Warehouse */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>SKU / Model Code</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={sku}
                        onChangeText={setSku}
                        placeholder="e.g. APL-IPADAIR-M2-128"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Warehouse Location</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={warehouseLoc}
                        onChangeText={setWarehouseLoc}
                        placeholder="e.g. Bugolobi Hub"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Stock & MOQ */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Warehouse Stock Units</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={stockQuantity}
                        onChangeText={setStockQuantity}
                        placeholder="e.g. 1450"
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Minimum Order Qty (MOQ)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={moq}
                        onChangeText={setMoq}
                        placeholder="e.g. 2"
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Status Selector */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Catalog Listing Status</Text>
                  <View style={styles.statusRow}>
                    {(['active', 'low_stock', 'draft'] as const).map((st) => {
                      const isSelected = status === st;
                      const label = st === 'active' ? 'Active' : st === 'low_stock' ? 'Low Stock' : 'Draft / Paused';
                      const activeColor = st === 'active' ? '#10B981' : st === 'low_stock' ? '#F59E0B' : '#6B7280';
                      return (
                        <TouchableOpacity
                          key={st}
                          activeOpacity={0.8}
                          onPress={() => setStatus(st)}
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor: isSelected ? `${activeColor}22` : isDark ? colors.cardColor : '#F3F4F6',
                              borderColor: isSelected ? activeColor : isDark ? colors.borderLight : 'transparent',
                            },
                          ]}
                        >
                          <View style={[styles.statusDot, { backgroundColor: activeColor }]} />
                          <Text style={[styles.statusChipText, { color: isSelected ? activeColor : colors.onSurfaceMuted }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Description & Technical Specs */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Specifications & Description</Text>
                  <View style={[styles.textAreaWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      placeholder="Detailed product overview, included commercial components, warranty..."
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.textAreaField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ── 2. VARIANTS: COLORS & SIZES ── */}
            {activeSection === 'variants' && (
              <View>
                {/* 🎨 AVAILABLE COLORS */}
                <View style={styles.formGroup}>
                  <View style={styles.sectionHeaderLine}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                      Available Colors ({productColors.length})
                    </Text>
                  </View>
                  <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' }]}>
                    Buyers can select their preferred wholesale color breakdown during checkout.
                  </Text>

                  {/* Active Color Chips */}
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
                            {col.name}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveColor(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcon name="close" size={14} color={colors.onSurfaceMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyVariantNotice, { color: colors.onSurfaceMuted }]}>
                      No colors assigned yet. Select from the presets below or add a custom color.
                    </Text>
                  )}

                  {/* Preset Colors Palette */}
                  <Text style={[styles.subLabel, { color: colors.onSurface }]}>Quick Preset Palette</Text>
                  <View style={styles.presetPaletteRow}>
                    {COLOR_PRESETS.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => handleAddPresetColor(preset)}
                        style={[
                          styles.presetColorBtn,
                          {
                            backgroundColor: isDark ? colors.cardColor : '#FFFFFF',
                            borderColor: isDark ? colors.borderLight : 'rgba(0,0,0,0.1)',
                          },
                        ]}
                      >
                        <View style={[styles.presetDot, { backgroundColor: preset.hex }]} />
                        <Text style={[styles.presetName, { color: colors.onSurface }]}>
                          {preset.name}
                        </Text>
                        <MaterialIcon name="add" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Add Custom Color */}
                  <View style={styles.customAddCard}>
                    <Text style={[styles.subLabel, { color: colors.onSurface }]}>Add Custom Color</Text>
                    <View style={styles.customAddRow}>
                      <View style={[styles.inputWrapper, { flex: 1.5, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customColorName}
                          onChangeText={setCustomColorName}
                          placeholder="Color Name (e.g. Sierra Blue)"
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>
                      <View style={[styles.inputWrapper, { flex: 1, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customColorHex}
                          onChangeText={setCustomColorHex}
                          placeholder="Hex (e.g. #738392)"
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

                {/* 📏 AVAILABLE SIZES / DIMENSIONS */}
                <View style={styles.formGroup}>
                  <View style={styles.sectionHeaderLine}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                      Available Sizes & Dimensions ({productSizes.length})
                    </Text>
                  </View>
                  <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' }]}>
                    Sizes can represent garment sizes, memory capacity, screen dimensions, or bulk packages.
                  </Text>

                  {/* Active Size Chips */}
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
                      No sizes assigned yet. Use the presets below or define custom sizes.
                    </Text>
                  )}

                  {/* Preset Sizes: Apparel */}
                  <Text style={[styles.subLabel, { color: colors.onSurface }]}>Apparel / General Sizes</Text>
                  <View style={styles.presetPaletteRow}>
                    {SIZE_PRESETS.apparel.map((preset, idx) => (
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

                  {/* Preset Sizes: Tech Storage */}
                  <Text style={[styles.subLabel, { color: colors.onSurface }]}>Tech Capacity / Memory</Text>
                  <View style={styles.presetPaletteRow}>
                    {SIZE_PRESETS.storage.map((preset, idx) => (
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

                  {/* Preset Sizes: Screen Sizes */}
                  <Text style={[styles.subLabel, { color: colors.onSurface }]}>Screen & Display Sizes</Text>
                  <View style={styles.presetPaletteRow}>
                    {SIZE_PRESETS.screen.map((preset, idx) => (
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

                  {/* Custom Size Form */}
                  <View style={styles.customAddCard}>
                    <Text style={[styles.subLabel, { color: colors.onSurface }]}>Add Custom Dimension / Size</Text>
                    <View style={styles.customAddRow}>
                      <View style={[styles.inputWrapper, { flex: 1.5, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customSizeName}
                          onChangeText={setCustomSizeName}
                          placeholder="e.g. 100 Liter Drum"
                          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                          style={[styles.inputField, { color: colors.onSurface }]}
                        />
                      </View>
                      <View style={[styles.inputWrapper, { flex: 1, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                        <TextInput
                          value={customSizeAbbr}
                          onChangeText={setCustomSizeAbbr}
                          placeholder="Code (e.g. 100L)"
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
              </View>
            )}

            {/* ── 3. WHOLESALE PRICING & TIERS ── */}
            {activeSection === 'pricing' && (
              <View>
                {/* Retail SRP */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Suggested Retail Price (SRP) in UGX</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={srp}
                      onChangeText={setSrp}
                      placeholder="e.g. 2900000"
                      keyboardType="numeric"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Tiered Volume Discounts */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Tiered Wholesale Volume Discounts</Text>
                  <Text style={[styles.fieldHelper, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' }]}>
                    Buyers purchasing above the tier quantity get the discounted per-unit rate automatically applied.
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

                {/* Additional Media Gallery URLs */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Gallery Media URLs ({mediaUrls.length})</Text>
                  {mediaUrls.map((url, idx) => (
                    <View key={idx} style={[styles.mediaUrlRow, { backgroundColor: isDark ? colors.cardColor : '#F8F9FA' }]}>
                      <Image source={{ uri: url }} style={styles.miniMediaThumb} />
                      <Text style={[styles.miniMediaUrlText, { color: colors.onSurface }]} numberOfLines={1}>{url}</Text>
                      <TouchableOpacity onPress={() => handleRemoveMediaUrl(idx)}>
                        <MaterialIcon name="close" size={16} color="#FF4D4F" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.addMediaRow}>
                    <View style={[styles.inputWrapper, { flex: 1, backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={newMediaUrl}
                        onChangeText={setNewMediaUrl}
                        placeholder="Additional Image URL (https://...)"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                    <TouchableOpacity onPress={handleAddMediaUrl} style={[styles.addTierBtn, { backgroundColor: colors.primary }]}>
                      <MaterialIcon name="add_photo_alternate" size={18} color="#FFFFFF" />
                      <Text style={styles.addTierBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ── 4. LOGISTICS, PACKAGING & SUPPORT ── */}
            {activeSection === 'logistics' && (
              <View>
                {/* Material & Packaging */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Primary Material</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={material}
                        onChangeText={setMaterial}
                        placeholder="e.g. 100% Cotton / Aluminum"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Packaging Format</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={packaging}
                        onChangeText={setPackaging}
                        placeholder="e.g. Carton (24 pcs)"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Weight & Warranty */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Unit Weight</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="e.g. 462g / unit"
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
                        placeholder="e.g. 1 Year Manufacturer"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Compliance Certification */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Standards & Compliance</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                    <TextInput
                      value={compliance}
                      onChangeText={setCompliance}
                      placeholder="e.g. UNBS Certified • CE • RoHS Approved"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                      style={[styles.inputField, { color: colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Direct Wholesale Support Contacts */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Supplier Phone</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={supportPhone}
                        onChangeText={setSupportPhone}
                        placeholder="e.g. +256 700 123456"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>WhatsApp Inquiries</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.cardColor : '#F6F8FA', borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)' }]}>
                      <TextInput
                        value={supportWhatsapp}
                        onChangeText={setSupportWhatsapp}
                        placeholder="e.g. +256 700 123456"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        style={[styles.inputField, { color: colors.onSurface }]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 20 }} />

            {/* Save Button */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <MaterialIcon name="check" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{isEditing ? 'Save All Changes' : 'Publish Product to Catalog'}</Text>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
    marginBottom: 12,
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
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
    gap: 4,
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
    marginBottom: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 6,
  },
  fieldHelper: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 10,
    lineHeight: 16,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    marginTop: 10,
    marginBottom: 6,
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
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputField: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    height: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
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
    borderRadius: 16,
    borderWidth: 1,
  },
  colorSwatchCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  variantChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  sizeAbbrBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizeAbbrText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
  },
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  presetName: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  customAddCard: {
    marginTop: 6,
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
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  emptyVariantNotice: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierQty: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
  },
  tierPrice: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  addTierRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  addTierInputBox: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addTierBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
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
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  addMediaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  textAreaWrapper: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textAreaField: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  saveButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  deleteButtonText: {
    color: '#FF4D4F',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
