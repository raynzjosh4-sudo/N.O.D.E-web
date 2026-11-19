import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';
import { MaterialIcon } from '@/core/widgets/material_icon';
import { PdfDocumentItem } from '../../domain/entities/profile_models';

interface PdfTabProps {
  documents: PdfDocumentItem[];
  onOpenPdf: (doc: PdfDocumentItem) => void;
}

export function PdfTab({ documents, onOpenPdf }: PdfTabProps) {
  const { colors } = useAppTheme();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (documents.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.cardColor }]}>
          <MaterialIcon
            name="picture_as_pdf"
            size={40}
            color={colors.onSurfaceMuted}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No PDFs yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
          Open an order sheet and tap "Download PDF" to generate and archive official commercial invoices.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollList}
    >
      {documents.map((doc) => (
        <TouchableOpacity
          key={doc.id}
          activeOpacity={0.75}
          style={styles.pdfTile}
          onPress={() => onOpenPdf(doc)}
        >
          {/* PDF Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcon
              name="picture_as_pdf"
              size={22}
              color={colors.primary}
            />
          </View>

          {/* Details */}
          <View style={styles.tileDetails}>
            <Text style={[styles.docTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {doc.title}
            </Text>

            <View style={styles.metaRow}>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary + '18' }]}>
                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>PDF</Text>
              </View>
              <Text style={[styles.metaText, { color: colors.onSurfaceMuted }]}>
                {formatDate(doc.updatedAt)} • {doc.fileSize}
              </Text>
            </View>
          </View>

          {/* Download / Open Action */}
          <View style={[styles.downloadCircle, { backgroundColor: colors.scaffoldBackground }]}>
            <MaterialIcon
              name="file_download"
              size={18}
              color={colors.onSurface}
            />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  pdfTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 31, 0.07)',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'rgba(18, 187, 240, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tileDetails: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: 'rgba(18, 187, 240, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: 'Outfit_800ExtraBold',
    color: AppColors.primary,
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(28, 27, 31, 0.45)',
  },
  downloadCircle: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 31, 0.1)',
    backgroundColor: 'rgba(28, 27, 31, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: 'rgba(28, 27, 31, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: AppColors.onSurface,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(28, 27, 31, 0.45)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
