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
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    backButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    breadcrumbsContainer: {
        flex: 1,
    },
    desktopPageTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_800ExtraBold',
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
        fontFamily: 'Outfit_600SemiBold',
        paddingHorizontal: 4,
    },
    breadcrumbActive: {
        fontFamily: 'Outfit_700Bold',
    },
    megamenuContainer: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 16,
        gap: 16,
    },
    leftSidebar: {
        width: 250,
        borderRadius: 6,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sidebarHeader: {
        fontSize: 11,
        fontFamily: 'Outfit_800ExtraBold',
        letterSpacing: 0.8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 0,
        borderBottomWidth: 1,
    },
    sidebarItemSelected: {
        borderLeftWidth: 3,
        borderLeftColor: '#FD8C73',
    },
    sidebarThumbnail: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 1,
    },
    sidebarItemText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        marginLeft: 10,
    },
    sidebarItemTextSelected: {
        fontFamily: 'Outfit_800ExtraBold',
    },
    rightContentArea: {
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        overflow: 'hidden',
    },
    categoryHeroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    heroThumbnail: {
        width: 42,
        height: 42,
        borderRadius: 4,
        borderWidth: 1,
    },
    heroTextWrapper: {
        flex: 1,
    },
    heroCategoryTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_800ExtraBold',
    },
    heroCategorySubtitle: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        marginTop: 2,
    },
    upLevelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
    },
    upLevelText: {
        fontSize: 12,
        fontFamily: 'Outfit_700Bold',
    },
    subCategoryGrid: {
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    subCategoryCard: {
        width: '31%',
        minWidth: 200,
        borderRadius: 6,
        borderWidth: 1,
        overflow: 'hidden',
    },
    subCardImage: {
        width: '100%',
        height: 110,
        borderBottomWidth: 1,
    },
    subCardContent: {
        padding: 12,
    },
    subCardTitle: {
        fontSize: 13.5,
        fontFamily: 'Outfit_700Bold',
    },
    subCardCount: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_500Medium',
        marginTop: 2,
    },
    viewProductsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    viewProductsText: {
        fontSize: 11.5,
        fontFamily: 'Outfit_700Bold',
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
