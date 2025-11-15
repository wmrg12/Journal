import { uiColors } from '@/constants/colors';
import { AVAILABLE_STICKER_IDS, STICKER_SOURCES } from '@/constants/stickers';
import S from '@/styles/pageViewStyles';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface StickerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (stickerId: string, category: string) => void;
}

const COLUMN_COUNT = 3;

export function StickerPickerModal({
  visible,
  onClose,
  onSelectSticker,
}: StickerPickerModalProps) {
  const handleStickerSelect = (stickerId: string) => {
    onSelectSticker(stickerId, 'objetos');
    onClose();
  };

  // Todos los stickers desde AVAILABLE_STICKER_IDS
  const allStickers = AVAILABLE_STICKER_IDS.map((id) => ({
    id,
    source: STICKER_SOURCES[id],
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={S.stickerModalOverlay}>
        {/* Fondo oscuro */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={S.stickerModalBackground} />
        </TouchableWithoutFeedback>

        {/* Contenedor del modal */}
        <View style={S.stickerOptionsContainer}>
          {/* Header */}
          <View style={S.stickerOptionsHeader}>
            <View style={S.stickerIconContainer}>
              <Ionicons name="happy-outline" size={20} color={uiColors.primary} />
            </View>
            <Text style={S.stickerOptionsTitle}>Seleccionar Sticker</Text>
          </View>

          {/* Grid de Stickers en 3 columnas */}
          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContainer}
            >
              <View style={styles.stickerGrid}>
                {allStickers.map((sticker) => (
                  <TouchableOpacity
                    key={sticker.id}
                    style={styles.stickerGridItem}
                    onPress={() => handleStickerSelect(sticker.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stickerBox}>
                      <Image
                        source={sticker.source}
                        style={styles.stickerImage}
                        resizeMode="contain"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stickerGridItem: {
    width: `${100 / COLUMN_COUNT}%`,
    aspectRatio: 1,
    padding: 8,
    marginBottom: 8,
  },
  stickerBox: {
    flex: 1,
    backgroundColor: uiColors.cards,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: uiColors.bord,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stickerImage: {
    width: '80%',
    height: '80%',
  },
});
