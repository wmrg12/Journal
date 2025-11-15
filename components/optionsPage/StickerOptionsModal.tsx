import { uiColors } from '@/constants/colors';
import { AVAILABLE_STICKER_IDS, STICKER_SOURCES } from '@/constants/stickers';
import pageStyles from '@/styles/pageViewStyles';
import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COLUMN_COUNT = 3;
const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / COLUMN_COUNT;

interface StickerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (stickerId: string, category: string) => void;
}

export function StickerPickerModal({
  visible,
  onClose,
  onSelectSticker,
}: StickerPickerModalProps) {
  const handleStickerSelect = (stickerId: string) => {
    console.log('Sticker seleccionado:', stickerId);
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
      <View style={pageStyles.stickerModalOverlay}>

        {/* Contenedor del modal */}
        <View style={pageStyles.stickerModalContainer}>
          {/* Header */}
          <View style={pageStyles.stickerModalHeader}>
            <View style={pageStyles.shapeIconContainer}>
                <Ionicons name="happy-outline"size={20} color={uiColors.black} />
            </View>
            <Text style={pageStyles.shapeOptionsTitle}>Seleccionar Sticker</Text>
          </View>

          {/* Grid de Stickers */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={pageStyles.stickerModalGridContainer}
          >
            <View style={pageStyles.stickerModalGrid}>
              {allStickers.map((sticker) => (
                <TouchableOpacity
                  key={sticker.id}
                  style={pageStyles.stickerModalItem}
                  onPress={() => handleStickerSelect(sticker.id)}
                  activeOpacity={0.7}
                >
                  <View style={pageStyles.stickerModalBox}>
                    <Image
                      source={sticker.source}
                      style={pageStyles.stickerModalImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={pageStyles.stickerModalLabel}></Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

