import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { CategoryDto } from '../../data/dto/product_dto';
import { ProductApiService } from '../../data/services/product_api_service';
import { useAuth } from '@/features/auth/context/auth_context';
import { resolveImageUrl } from '@/core/utils/image_utils';

const LEGACY_CATEGORY_IMAGES: Record<string, number> = {
  'assets/welcomeimages/1.jpg': require('@/../assets/welcomeimages/1.jpg'),
  'assets/welcomeimages/26ABTest_Computing_THUMBNAILS_300x300.png': require('@/../assets/welcomeimages/26ABTest_Computing_THUMBNAILS_300x300.png'),
  'assets/welcomeimages/26ABTest_Fashion_THUMBNAILS_300x300.png': require('@/../assets/welcomeimages/26ABTest_Fashion_THUMBNAILS_300x300.png'),
  'assets/welcomeimages/26ABTest_Jumia-Picks_THUMBNAILS_300x300.png': require('@/../assets/welcomeimages/26ABTest_Jumia-Picks_THUMBNAILS_300x300.png'),
  'assets/welcomeimages/26ABTest_Mens-Shoes_THUMBNAILS_300x300.png': require('@/../assets/welcomeimages/26ABTest_Mens-Shoes_THUMBNAILS_300x300.png'),
};

function getCategoryImageSource(imageUrl?: string | null) {
  const url = imageUrl?.trim();
  if (!url) return null;
  return LEGACY_CATEGORY_IMAGES[url] ?? { uri: resolveImageUrl(url) };
}

export interface CategorySelectionResult {
  id: string;
  name: string;
  fullPath: string;
}

interface CategoryBranchPickerProps {
  visible: boolean;
  selectedCategoryId?: string;
  onSelect: (result: CategorySelectionResult) => void;
  onClose: () => void;
}

export function CategoryBranchPicker({
  visible,
  selectedCategoryId,
  onSelect,
  onClose,
}: CategoryBranchPickerProps) {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { getToken } = useAuth();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Drilldown navigation stack of CategoryDto
  const [navStack, setNavStack] = useState<CategoryDto[]>([]);

  // Inline "Create New Category" sheet state
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImageUri, setNewCategoryImageUri] = useState<string | null>(null);
  const [newCategoryImageBase64, setNewCategoryImageBase64] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const handlePickCategoryImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setNewCategoryImageUri(res.assets[0].uri);
        if (res.assets[0].base64) {
          setNewCategoryImageBase64(`data:image/jpeg;base64,${res.assets[0].base64}`);
        }
      }
    } catch (e: any) {
      console.warn('Category image pick failed:', e.message);
    }
  };

  // Load live categories from backend
  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const cats = await ProductApiService.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (err: any) {
      console.warn('Failed to load categories:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCategories();
      setSearchQuery('');
      setNavStack([]);
    }
  }, [visible]);

  // Current active parent in navigation drilldown (null = root level)
  const currentParent = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  // Filtered children for current drilldown level
  const displayedCategories = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return categories.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (!currentParent) {
      // Level 0: Categories with no parent_id or level === 0
      return categories.filter((c) => !c.parent_id || c.level === 0);
    }
    // Subcategories whose parent_id matches current parent
    return categories.filter((c) => c.parent_id === currentParent.id);
  }, [categories, currentParent, searchQuery]);

  // Build full breadcrumb path for a given category
  const buildBreadcrumb = (cat: CategoryDto): string => {
    const parts = [cat.name];
    let curr = cat;
    while (curr.parent_id) {
      const parent = categories.find((c) => c.id === curr.parent_id);
      if (parent) {
        parts.unshift(parent.name);
        curr = parent;
      } else {
        break;
      }
    }
    return parts.join(' › ');
  };

  const handleSelectFinal = (cat: CategoryDto) => {
    const fullPath = buildBreadcrumb(cat);
    onSelect({
      id: cat.id,
      name: cat.name,
      fullPath,
    });
    onClose();
  };

  // Always allow drilling into any category — even leaf ones — so the user
  // can create subcategories inside them from the footer "Add Sub-category" button.
  const handleDrillIn = (cat: CategoryDto) => {
    setNavStack((prev) => [...prev, cat]);
  };

  const handlePop = () => {
    setNavStack((prev) => prev.slice(0, -1));
  };

  // Create category / subcategory in current branch
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    try {
      const parent = currentParent;
      let created: CategoryDto;

      if (newCategoryImageUri) {
        // Use multipart upload — the picker gives us a file:// URI, not base64
        created = await ProductApiService.createCategoryWithImage({
          name: newCategoryName.trim(),
          parent_id: parent ? parent.id : null,
          level: parent ? (parent.level || 0) + 1 : 0,
          file: {
            uri: newCategoryImageUri,
            name: 'category.jpg',
            type: 'image/jpeg',
          },
        }, getToken() ?? undefined);
      } else {
        // No image — JSON payload without image
        created = await ProductApiService.createCategory({
          name: newCategoryName.trim(),
          parent_id: parent ? parent.id : null,
          level: parent ? (parent.level || 0) + 1 : 0,
        }, getToken() ?? undefined);
      }

      // Update local categories list
      setCategories((prev) => [...prev, created]);
      setNewCategoryName('');
      setNewCategoryImageUri(null);
      setNewCategoryImageBase64(null);
      setIsCreatingModal(false);

      // Directly select newly created category branch
      handleSelectFinal(created);
    } catch (err: any) {
      console.warn('Create category error:', err.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalContainer,
            isDesktop && styles.modalContainerDesktop,
            { backgroundColor: isDark ? '#1C1C21' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? colors.borderLight : '#E5E7EB' }]}>
            <View style={styles.headerTitleRow}>
              {navStack.length > 0 && (
                <TouchableOpacity onPress={handlePop} style={styles.backBtn}>
                  <MaterialIcon name="arrow_back" size={20} color={colors.onSurface} />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.onSurface }]}>
                  {currentParent ? currentParent.name : 'Choose Category'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
                  {currentParent
                    ? `Branch: ${navStack.map((c) => c.name).join(' › ')}`
                    : 'Select main category or drill down into sub-branches'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcon name="close" size={22} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? colors.cardColor : '#F3F4F6' }]}>
              <MaterialIcon name="search" size={18} color={colors.onSurfaceMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search categories or sub-branches..."
                placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                style={[styles.searchInput, { color: colors.onSurface }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcon name="cancel" size={18} color={colors.onSurfaceMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Breadcrumb Trail (when drilled in) */}
          {navStack.length > 0 && !searchQuery && (
            <View style={[styles.breadcrumbRow, { backgroundColor: isDark ? '#26262B' : '#F9FAFB' }]}>
              <TouchableOpacity onPress={() => setNavStack([])}>
                <Text style={[styles.breadcrumbText, { color: colors.primary }]}>All Categories</Text>
              </TouchableOpacity>
              {navStack.map((step, idx) => {
                const isLast = idx === navStack.length - 1;
                return (
                  <React.Fragment key={step.id}>
                    <Text style={[styles.breadcrumbSeparator, { color: colors.onSurfaceMuted }]}>›</Text>
                    <TouchableOpacity
                      disabled={isLast}
                      onPress={() => setNavStack(navStack.slice(0, idx + 1))}
                    >
                      <Text
                        style={[
                          styles.breadcrumbText,
                          {
                            color: isLast ? colors.onSurface : colors.primary,
                            fontWeight: isLast ? '700' : '500',
                          },
                        ]}
                      >
                        {step.name}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Current Category Quick Selector (Option to select this level directly) */}
          {currentParent && !searchQuery && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectFinal(currentParent)}
              style={[
                styles.selectCurrentPill,
                {
                  backgroundColor: isDark ? colors.cardColor : '#EFF6FF',
                  borderColor: colors.primary,
                },
              ]}
            >
              <MaterialIcon name="check_circle" size={18} color={colors.primary} />
              <Text style={[styles.selectCurrentText, { color: colors.primary }]}>
                Select "{currentParent.name}" directly for this listing
              </Text>
            </TouchableOpacity>
          )}

          {/* Body List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceMuted }]}>Loading categories...</Text>
            </View>
          ) : displayedCategories.length === 0 ? (
            <View style={styles.centerContainer}>
              <MaterialIcon name="category" size={40} color={colors.onSurfaceMuted} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Categories Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
                {searchQuery
                  ? `No category matches "${searchQuery}". You can create it now below.`
                  : 'No subcategories in this branch yet.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.listContent} showsVerticalScrollIndicator={false}>
              {displayedCategories.map((item) => {
                const hasSub = categories.some((c) => c.parent_id === item.id);
                const isSelected = selectedCategoryId === item.id;
                const pathDesc = searchQuery ? buildBreadcrumb(item) : null;
                const categoryImage = getCategoryImageSource(
                  item.image_url ||
                    categories.find((category) => category.id === item.parent_id)?.image_url
                );

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.categoryRow,
                      {
                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                        backgroundColor: isSelected ? (isDark ? '#253342' : '#EFF6FF') : 'transparent',
                      },
                    ]}
                  >
                    {/* Left tap area: selects this category directly */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectFinal(item)}
                      style={styles.categoryRowLeft}
                    >
                      {categoryImage ? (
                        <Image
                          source={categoryImage}
                          style={[
                            styles.categoryImageThumbnail,
                            isSelected && { borderColor: colors.primary },
                          ]}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.categoryIconBox,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : isDark
                                ? colors.cardColor
                                : '#F0F2F5',
                            },
                          ]}
                        >
                          <MaterialIcon
                            name={hasSub ? 'folder' : 'label'}
                            size={18}
                            color={isSelected ? '#FFFFFF' : colors.primary}
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.categoryName,
                            {
                              color: isSelected ? colors.primary : colors.onSurface,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                        {pathDesc && (
                          <Text style={[styles.categoryPath, { color: colors.onSurfaceMuted }]}>
                            {pathDesc}
                          </Text>
                        )}
                        {!searchQuery && (
                          <Text style={[styles.categoryPath, { color: colors.onSurfaceMuted }]}>
                            {hasSub ? 'Has subcategories · tap → to drill in' : 'Tap → to add subcategories'}
                          </Text>
                        )}
                      </View>
                      {isSelected && <MaterialIcon name="check" size={18} color={colors.primary} />}
                    </TouchableOpacity>

                    {/* Right tap area: drills into this category to browse/create subcategories */}
                    {!searchQuery && (
                      <TouchableOpacity
                        activeOpacity={0.5}
                        onPress={() => handleDrillIn(item)}
                        style={styles.drillAction}
                        hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                      >
                        <Text style={[styles.subCountText, { color: colors.onSurfaceMuted }]}>
                          {hasSub ? 'Branch' : 'Enter'}
                        </Text>
                        <MaterialIcon name="chevron_right" size={20} color={colors.onSurfaceMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Footer: Create Category Button */}
          <View style={[styles.footer, { borderTopColor: isDark ? colors.borderLight : '#E5E7EB' }]}>
            {isCreatingModal ? (
              <View style={styles.createBox}>
                <Text style={[styles.createLabel, { color: colors.onSurface }]}>
                  {currentParent
                    ? `New Sub-category in "${currentParent.name}"`
                    : 'New Root Category'}
                </Text>
                <View style={styles.createInputRow}>
                  {/* Optional Image Picker for Category */}
                  <TouchableOpacity
                    onPress={handlePickCategoryImage}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      backgroundColor: isDark ? colors.cardColor : '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      overflow: 'hidden',
                    }}
                  >
                    {newCategoryImageUri ? (
                      <Image source={{ uri: newCategoryImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <MaterialIcon name="add_photo_alternate" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Enter category name..."
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                    style={[
                      styles.createInput,
                      {
                        color: colors.onSurface,
                        backgroundColor: isDark ? colors.cardColor : '#F3F4F6',
                        borderColor: colors.borderLight,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    disabled={isSavingCategory || !newCategoryName.trim()}
                    onPress={handleCreateCategory}
                    style={[
                      styles.createBtnConfirm,
                      {
                        backgroundColor: colors.primary,
                        opacity: newCategoryName.trim() ? 1 : 0.5,
                      },
                    ]}
                  >
                    {isSavingCategory ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.createBtnConfirmText}>Add</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsCreatingModal(false);
                      setNewCategoryImageUri(null);
                      setNewCategoryImageBase64(null);
                    }}
                    style={styles.createBtnCancel}
                  >
                    <MaterialIcon name="close" size={20} color={colors.onSurfaceMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsCreatingModal(true)}
                style={[styles.createTriggerBtn, { borderColor: colors.primary }]}
              >
                <MaterialIcon name="add_circle_outline" size={18} color={colors.primary} />
                <Text style={[styles.createTriggerText, { color: colors.primary }]}>
                  {currentParent
                    ? `+ Add Sub-category in "${currentParent.name}"`
                    : '+ Create New Category'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    height: '80%',
    maxHeight: 640,
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalContainerDesktop: {
    maxWidth: 580,
    maxHeight: 700,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  breadcrumbText: {
    fontSize: 12,
  },
  breadcrumbSeparator: {
    fontSize: 12,
  },
  selectCurrentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  selectCurrentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImageThumbnail: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F0F2F5',
  },
  categoryName: {
    fontSize: 15,
  },
  categoryPath: {
    fontSize: 11,
    marginTop: 2,
  },
  drillAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subCountText: {
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  createTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  createTriggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createBox: {
    gap: 8,
  },
  createLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  createBtnConfirm: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  createBtnCancel: {
    padding: 10,
  },
});
