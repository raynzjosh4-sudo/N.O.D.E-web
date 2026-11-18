import { AppColors } from "@/core/theme/app_theme";
import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    maxWidthWrapper: {
        width: '100%',
        maxWidth: 800,
        flex: 1,
    },

    // Desktop Megamenu Styles
    desktopOuterLayout: {
        width: '100%',
        flex: 1,
        flexDirection: 'row',
    },
    desktopMainFlow: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    desktopTopNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(28, 27, 31, 0.08)',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(28, 27, 31, 0.05)',
    },
    breadcrumbsContainer: {
        flex: 1,
    },
    desktopPageTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_900Black',
        color: AppColors.onSurface,
    },
    breadcrumbTrail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbText: {
        fontSize: 12.5,
        fontFamily: 'Outfit_700Bold',
        color: AppColors.primary,
        paddingHorizontal: 4,
    },
    breadcrumbActive: {
        color: AppColors.onSurface,
    },
    megamenuContainer: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 16,
        gap: 20,
    },
    leftSidebar: {
        width: 270,
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(28, 27, 31, 0.06)',
    },
    sidebarHeader: {
        fontSize: 11,
        fontFamily: 'Outfit_800ExtraBold',
        color: 'rgba(28, 27, 31, 0.45)',
        letterSpacing: 0.8,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 14,
        marginBottom: 4,
    },
    sidebarItemSelected: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    sidebarThumbnail: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: AppColors.surfaceContainerHighest,
    },
    sidebarItemText: {
        flex: 1,
        fontSize: 13.5,
        fontFamily: 'Outfit_700Bold',
        color: 'rgba(28, 27, 31, 0.7)',
        marginLeft: 10,
    },
    sidebarItemTextSelected: {
        color: AppColors.primary,
    },
    rightContentArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(28, 27, 31, 0.06)',
    },
    categoryHeroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(28, 27, 31, 0.06)',
        marginBottom: 18,
    },
    heroThumbnail: {
        width: 54,
        height: 54,
        borderRadius: 16,
    },
    heroTextWrapper: {
        flex: 1,
    },
    heroCategoryTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_900Black',
        color: AppColors.onSurface,
    },
    heroCategorySubtitle: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: 'rgba(28, 27, 31, 0.5)',
        marginTop: 2,
    },
    upLevelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(18, 187, 240, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    upLevelText: {
        fontSize: 12,
        fontFamily: 'Outfit_700Bold',
        color: AppColors.primary,
    },
    subCategoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    subCategoryCard: {
        width: '31%',
        minWidth: 200,
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(28, 27, 31, 0.06)',
        overflow: 'hidden',
    },
    subCardImage: {
        width: '100%',
        height: 120,
    },
    subCardContent: {
        padding: 12,
    },
    subCardTitle: {
        fontSize: 14,
        fontFamily: 'Outfit_800ExtraBold',
        color: AppColors.onSurface,
    },
    subCardCount: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: 'rgba(28, 27, 31, 0.5)',
        marginTop: 2,
    },
    viewProductsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
    },
    viewProductsText: {
        fontSize: 12,
        fontFamily: 'Outfit_700Bold',
        color: AppColors.primary,
    },
    productGridContainer: {
        paddingBottom: 20,
    },
    productCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    productCardCell: {
        width: '31%',
        minWidth: 190,
    },
    productCardCellNarrow: {
        width: '46%',
    },

    // Mobile Styles
    mobileHeaderContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(28, 27, 31, 0.05)',
    },
    mobileHeaderTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mobileHeaderTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_800ExtraBold',
        color: AppColors.onSurface,
    },
    mobileBreadcrumbRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        flexWrap: 'wrap',
    },
    mobileBreadcrumbLink: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        color: AppColors.primary,
        paddingHorizontal: 4,
    },
    listContent: {
        paddingVertical: 8,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(28, 27, 31, 0.05)',
        marginLeft: 74,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    categoryImage: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: AppColors.surfaceContainerHighest,
    },
    categoryTextWrapper: {
        flex: 1,
        marginLeft: 14,
    },
    categoryName: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: AppColors.onSurface,
    },
    categorySubtitle: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: 'rgba(28, 27, 31, 0.5)',
        marginTop: 2,
    },
});
