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
import { Product, PriceTier } from '../../domain/entities/product';
import { useProducts } from '../../context/products_context';

interface EditProductSheetProps {
  visible: boolean;
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditProductSheet({
  visible,
  product,
  onClose,
  onSuccess,
}: EditProductSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { updateProduct, addProduct, deleteProduct } = useProducts();

  const isEditing = Boolean(product);

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
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);

  // New tier temporary inputs
  const [newTierQty, setNewTierQty] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');

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
      setPriceTiers(product.priceTiers ? [...product.priceTiers] : []);
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
      setPriceTiers([
        { minQuantity: 1, price: 950000 },
        { minQuantity: 5, price: 850000 },
      ]);
    }
  }, [product, visible]);

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

    if (isEditing && product) {
      updateProduct(product.id, {
        name: name.trim(),
        brand: brand.trim(),
        categoryName: categoryName.trim(),
        sku: sku.trim(),
        warehouseLoc: warehouseLoc.trim(),
        srp: numericSrp,
        stockQuantity: numericStock,
        moq: numericMoq,
        description: description.trim(),
        imageUrl: imageUrl.trim() || product.imageUrl,
        status,
        priceTiers: tiersToSave,
      });
    } else {
      addProduct({
        name: name.trim(),
        brand: brand.trim(),
        categoryName: categoryName.trim(),
        sku: sku.trim(),
        warehouseLoc: warehouseLoc.trim(),
        srp: numericSrp,
        stockQuantity: numericStock,
        moq: numericMoq,
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        status,
        priceTiers: tiersToSave,
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
      if (onSuccess) {
        onSuccess();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm?.(`Are you sure you want to delete "${product.name}" from your catalog?`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        'Delete Product',
        `Are you sure you want to delete "${product.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmAction },
        ]
      );
    }
  };

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: isDark ? '#1C1C21' : '#FFFFFF' },
          ]}
        >
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
                {isEditing ? 'Update Product' : 'Add Wholesale Product'}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
                ]}
              >
                {isEditing ? `Editing SKU: ${sku || product?.id}` : 'Create a new inventory listing'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <MaterialIcon name="close" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
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
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Product Image URL</Text>
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
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Apple iPad Air 11-inch M2 Chip"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                  style={[styles.inputField, { color: colors.onSurface }]}
                />
              </View>
            </View>

            {/* Brand & Category Row */}
            <View style={styles.twoColRow}>
              <View style={styles.halfCol}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Brand</Text>
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
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholder="e.g. Electronics"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                    style={[styles.inputField, { color: colors.onSurface }]}
                  />
                </View>
              </View>
            </View>

            {/* SKU & Warehouse Location */}
            <View style={styles.twoColRow}>
              <View style={styles.halfCol}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>SKU / Model</Text>
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
                    value={sku}
                    onChangeText={setSku}
                    placeholder="e.g. ND-PROD-99"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                    style={[styles.inputField, { color: colors.onSurface }]}
                  />
                </View>
              </View>

              <View style={styles.halfCol}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Warehouse Location</Text>
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
                    value={warehouseLoc}
                    onChangeText={setWarehouseLoc}
                    placeholder="e.g. Bugolobi Hub"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                    style={[styles.inputField, { color: colors.onSurface }]}
                  />
                </View>
              </View>
            </View>

            {/* Inventory Units & MOQ */}
            <View style={styles.twoColRow}>
              <View style={styles.halfCol}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Stock Units Available</Text>
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

            {/* Retail SRP */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Retail Market Price (UGX)</Text>
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
                  value={srp}
                  onChangeText={setSrp}
                  placeholder="e.g. 2900000"
                  keyboardType="numeric"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                  style={[styles.inputField, { color: colors.onSurface }]}
                />
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
                          backgroundColor: isSelected
                            ? `${activeColor}22`
                            : isDark ? colors.cardColor : '#F3F4F6',
                          borderColor: isSelected ? activeColor : isDark ? colors.borderLight : 'transparent',
                        },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: activeColor }]} />
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isSelected ? activeColor : colors.onSurfaceMuted },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Wholesale Price Tiers Breakdown */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Tiered Wholesale Volume Discounts
              </Text>
              <Text
                style={[
                  styles.fieldHelper,
                  { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' },
                ]}
              >
                Incentivize large retail purchases with multi-tier bulk pricing.
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
                    <Text style={[styles.tierQty, { color: colors.primary }]}>
                      {tier.minQuantity}+ units
                    </Text>
                    <Text style={[styles.tierPrice, { color: colors.onSurface }]}>
                      UGX {tier.price.toLocaleString()} / unit
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveTier(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcon name="delete_outline" size={18} color="#FF4D4F" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add New Tier Sub-form */}
              <View style={styles.addTierRow}>
                <View
                  style={[
                    styles.addTierInputBox,
                    {
                      backgroundColor: isDark ? colors.cardColor : '#F6F8FA',
                      borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <TextInput
                    value={newTierQty}
                    onChangeText={setNewTierQty}
                    placeholder="Min Qty (e.g. 10)"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                    style={[styles.inputField, { color: colors.onSurface }]}
                  />
                </View>

                <View
                  style={[
                    styles.addTierInputBox,
                    {
                      flex: 1.5,
                      backgroundColor: isDark ? colors.cardColor : '#F6F8FA',
                      borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <TextInput
                    value={newTierPrice}
                    onChangeText={setNewTierPrice}
                    placeholder="UGX / Unit"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                    style={[styles.inputField, { color: colors.onSurface }]}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleAddTier}
                  style={[styles.addTierBtn, { backgroundColor: colors.primary }]}
                >
                  <MaterialIcon name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addTierBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description & Specs */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Specifications & Description</Text>
              <View
                style={[
                  styles.textAreaWrapper,
                  {
                    backgroundColor: isDark ? colors.cardColor : '#F6F8FA',
                    borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter detailed packaging specifications, warranty info, and bulk terms..."
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                  style={[styles.textAreaField, { color: colors.onSurface }]}
                />
              </View>
            </View>

            <View style={{ height: 20 }} />

            {/* Action Buttons */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
            >
              <MaterialIcon name="check" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Save Changes' : 'Publish Product to Catalog'}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDelete}
                style={styles.deleteButton}
              >
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
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '92%',
    maxWidth: 620,
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
    marginBottom: 16,
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
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 8,
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
  tierQty: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
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
