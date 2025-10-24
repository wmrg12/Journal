import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { pagePalette, uiColors, textColors, drawColors } from "@/constants/colors";
import { textFonts, TextFont } from "@/constants/fonts";
import Slider from "@react-native-community/slider";
import S from "../../styles/pageViewStyles";
import {
  createPage,
  deletePage,
  getTotalPages,
  getPageColor,
} from "@/src/db/dao";

type Params = {
  journalId?: string;
  color?: string;
  pageNumber?: string;
  totalPages?: string;
};

type DrawTool = "pencil" | "pen" | "marker";

export default function PageView() {
  const { journalId, color, pageNumber, totalPages } =
    useLocalSearchParams<Params>();
  const router = useRouter();

  const [bg, setBg] = useState<(typeof pagePalette)[number]>(pagePalette[0]);
  const [showDrawMenu, setShowDrawMenu] = useState(false);
  const [showDrawTools, setShowDrawTools] = useState(false);

  const [selectedTool, setSelectedTool] = useState<DrawTool>("pencil");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const strokeWidths = [1, 2, 4, 6, 8];

  const [showTextOptions, setShowTextOptions] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState<
    (typeof textColors)[number]
  >(textColors[0]);
  const [selectedFont, setSelectedFont] = useState<TextFont>(textFonts[0]);
  const [textInput, setTextInput] = useState("");

  // inicializa desde el param `color` si viene
  useEffect(() => {
    if (typeof color === "string") {
      const found = (pagePalette as readonly string[]).find(
        (c) => c.toLowerCase() === color.toLowerCase()
      );
      setBg((found ?? pagePalette[0]) as (typeof pagePalette)[number]);
    } else {
      setBg(pagePalette[0]);
    }
  }, [color]);

  // consulta el color guardado en BD para esta página y lo aplica
  const pageNum = Math.max(Number(pageNumber ?? 1) || 1, 1);
  useEffect(() => {
    if (!journalId) return;
    (async () => {
      const dbColor = await getPageColor(String(journalId), pageNum);
      if (typeof dbColor === "string" && dbColor.length > 0) {
        const found = (pagePalette as readonly string[]).find(
          (c) => c.toLowerCase() === dbColor.toLowerCase()
        );
        if (found) setBg(found as (typeof pagePalette)[number]);
      }
    })().catch(console.error);
  }, [journalId, pageNum]);

  const total = Math.max(Number(totalPages ?? 1) || 1, 1);
  const totalParam = Math.max(total, 1);

  // al cargar, sincroniza el total con lo que hay en BD
  useEffect(() => {
    if (!journalId) return;
    (async () => {
      const dbTotal = await getTotalPages(String(journalId));
      const safeTotal = Math.max(dbTotal, 1);
      if (safeTotal !== totalParam || pageNum > safeTotal) {
        router.replace({
          pathname: "/page",
          params: {
            journalId,
            color: String(bg),
            pageNumber: String(Math.min(pageNum, safeTotal)),
            totalPages: String(safeTotal),
          },
        });
      }
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  // acciones
  const handleDeletePage = () => {
    if (totalParam <= 1 || !journalId) {
      Alert.alert("No se puede eliminar", "Debe existir al menos una página.");
      return;
    }
    Alert.alert("Eliminar página", `¿Eliminar la página ${pageNum}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const { pageNumber: target, total: newTotal } = await deletePage(
              String(journalId),
              pageNum
            );
            router.replace({
              pathname: "/page",
              params: {
                journalId,
                color: String(bg),
                pageNumber: String(target),
                totalPages: String(newTotal),
              },
            });
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudo eliminar la página.");
          }
        },
      },
    ]);
  };

  const handleAddPage = async () => {
    if (!journalId) return;
    try {
      // crea heredando el color actual de la hoja
      const { pageNumber: newNum, total: newTotal } = await createPage(
        String(journalId),
        String(bg)
      );
      router.replace({
        pathname: "/page",
        params: {
          journalId,
          color: String(bg),
          pageNumber: String(newNum),
          totalPages: String(newTotal),
        },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear la página.");
    }
  };

  const handleSelectDrawMode = (mode: "text" | "draw") => {
    setShowDrawMenu(false);
    if (mode === "draw") {
      setShowDrawTools(true);
    } else {
      setShowTextOptions(true);
    }
  };

  const handleSelectTool = (tool: DrawTool) => {
    setSelectedTool(tool);
  };
  const handleAddText = () => {
    if (textInput.trim()) {
      // implementarías la lógica para añadir el texto al canvas
      Alert.alert('Texto añadido', `Color: ${selectedTextColor}, Font: ${selectedFont}`);
      setTextInput('');
      setShowTextOptions(false);
    }
  };

  return (
    <SafeAreaView
      style={[S.container, { backgroundColor: bg }]}
      edges={["top", "left", "right"]}
    >
      {/* header */}
      <View style={S.header}>
        {/* IZQUIERDA: ← → */}
        <View style={S.leftGroup}>
          {pageNum > 1 && (
            <TouchableOpacity
              onPress={() =>
                router.replace({
                  pathname: "/page",
                  params: {
                    journalId,
                    color: String(bg),
                    pageNumber: String(pageNum - 1),
                    totalPages: String(total),
                  },
                })
              }
              style={S.navButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <MaterialIcons
                name="arrow-back-ios"
                size={22}
                color={uiColors.danger}
              />
            </TouchableOpacity>
          )}
          {pageNum < total && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/page",
                  params: {
                    journalId,
                    color: String(bg),
                    pageNumber: String(pageNum + 1),
                    totalPages: String(total),
                  },
                })
              }
              style={S.navButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <MaterialIcons
                name="arrow-forward-ios"
                size={22}
                color={uiColors.danger}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={S.titleWrap} pointerEvents="none">
          <Text style={S.title}>{`Pag ${pageNum}`}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            router.replace({
              pathname: "/tabs/home",
              params: { journalId, color: String(bg) },
            });
          }}
          style={S.checkButton}
          accessibilityLabel="Hecho"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <MaterialIcons name="check" size={22} color={uiColors.danger} />
        </TouchableOpacity>
      </View>

      {/* lienzo */}
      <View style={S.canvas} />

      {/* toolbar */}
      <View style={S.toolbar}>
        {/* 1) subir img,audio, etc */}
        <TouchableOpacity
          style={S.toolCircle}
          onPress={() => {}}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="more-horiz" size={28} color="#333" />
        </TouchableOpacity>

        {/* 2) eliminar pag actual */}
        <TouchableOpacity
          style={S.toolCircle}
          onPress={handleDeletePage}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="delete-outline" size={28} color="#d32f2f" />
        </TouchableOpacity>

        {/* 3) añadir pag */}
        <TouchableOpacity
          style={S.toolCircle}
          onPress={handleAddPage}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="add" size={32} color="#2467a5ea" />
        </TouchableOpacity>

        {/* 4) dibujar */}
        <TouchableOpacity
          style={S.toolCircle}
          onPress={() => {
            setShowDrawMenu(!showDrawMenu);
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="edit" size={26} color="#333" />
        </TouchableOpacity>

        {/* 5) undo */}
        <TouchableOpacity
          style={S.toolCircle}
          onPress={() => {}}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="undo" size={26} color="#757575" />
        </TouchableOpacity>

        {/* 6) redo */}
        <TouchableOpacity
          style={S.toolCircle}
          onPress={() => {}}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="redo" size={26} color="#757575" />
        </TouchableOpacity>
      </View>

      {/* Modal de selección de modo */}
      <Modal
        visible={showDrawMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDrawMenu(false)}
      >
        <TouchableOpacity
          style={S.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDrawMenu(false)}
        >
          <View style={S.modalMenuContainer}>
            {/* Opción Dibujar */}
            <TouchableOpacity
              style={S.modalOption}
              onPress={() => handleSelectDrawMode("draw")}
              activeOpacity={0.7}
            >
              <MaterialIcons name="brush" size={22} color="#333" />
              <Text style={S.modalOptionText}>Dibujar</Text>
            </TouchableOpacity>

            {/* Opción Texto */}
            <TouchableOpacity
              style={S.modalOption}
              onPress={() => handleSelectDrawMode("text")}
              activeOpacity={0.7}
            >
              <MaterialIcons name="text-fields" size={22} color="#333" />
              <Text style={S.modalOptionText}>Texto</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de opciones de texto */}
      <Modal
        visible={showTextOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTextOptions(false)}
      >
        <View style={S.textModalOverlay}>
          <TouchableOpacity
            style={S.textModalBackground}
            activeOpacity={1}
            onPress={() => setShowTextOptions(false)}
          />
          <View style={S.textOptionsContainer}>
            {/* Header */}
            <View style={S.textOptionsHeader}>
              <View style={S.textIconContainer}>
                <Text style={S.textIconLetter}>T</Text>
              </View>
              <Text style={S.textOptionsTitle}>Escribir texto</Text>
            </View>

            {/* Input de texto */}
            <TextInput
              style={S.textInput}
              placeholder="Escribe aquí..."
              value={textInput}
              onChangeText={setTextInput}
              multiline
              autoFocus
            />

            {/* Colores */}
            <View style={S.colorSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {textColors.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption}
                    onPress={() => setSelectedTextColor(colorOption)}
                    style={[
                      S.colorCircle,
                      { backgroundColor: colorOption },
                      selectedTextColor === colorOption &&
                        S.colorCircleSelected,
                    ]}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Fuentes */}
            <View style={S.fontSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {textFonts.map((font) => (
                  <TouchableOpacity
                    key={font}
                    onPress={() => setSelectedFont(font)}
                    style={[
                      S.fontButton,
                      selectedFont === font && S.fontButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        S.fontButtonText,
                        { fontFamily: font },
                        selectedFont === font && S.fontButtonTextSelected,
                      ]}
                    >
                      {font}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={S.fontButton}>
                  <Text style={S.fontButtonText}>...</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Botón añadir */}
            <TouchableOpacity
              style={S.addTextButton}
              onPress={handleAddText}
              activeOpacity={0.7}
            >
              <Text style={S.addTextButtonText}>Añadir texto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal de herramientas de dibujo */}
      <Modal
        visible={showDrawTools}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDrawTools(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDrawTools(false)}>
          <View style={S.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={S.drawModalContent}>
                {/* Herramientas y colores en una misma fila */}
                <View style={S.toolsAndColorsRow}>
                  {/* Herramientas */}
                  <View style={S.toolsRow}>
                    {[
                      { id: "pencil", icon: "edit", label: "Lápiz" },
                      { id: "pen", icon: "brush", label: "Pincel" },
                      { id: "marker", icon: "create", label: "Marcador" },
                    ].map((tool) => (
                      <TouchableOpacity
                        key={tool.id}
                        style={[
                          S.toolButtonCompact,
                          selectedTool === tool.id && S.toolButtonActive,
                        ]}
                        onPress={() => handleSelectTool(tool.id as DrawTool)}
                      >
                        <MaterialIcons
                          name={tool.icon as any}
                          size={20}
                          color="#333"
                        />
                        <Text style={S.toolLabelCompact}>{tool.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Colores */}
                  <View style={S.colorsRow}>
                    {drawColors.map((clr) => (
                      <TouchableOpacity
                        key={clr}
                        style={[
                          S.colorButtonCompact,
                          { backgroundColor: clr },
                          selectedColor === clr && S.colorButtonActive,
                        ]}
                        onPress={() => setSelectedColor(clr)}
                      />
                    ))}
                  </View>
                </View>

                <View style={S.thicknessSliderSection}>
                  <Text style={S.sectionLabel}>Grosor</Text>

                  <View style={S.sliderWrapper}>
                    <Slider
                      style={S.slider}
                      minimumValue={1}
                      maximumValue={6}
                      step={1}
                      value={strokeWidth}
                      onValueChange={(value) => setStrokeWidth(value)}
                      minimumTrackTintColor="#2196F3"
                      maximumTrackTintColor="#ddd"
                      thumbTintColor="#2196F3"
                    />

                    <View style={S.dotsRow}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            S.dot,
                            {
                              backgroundColor:
                                i + 1 === Math.round(strokeWidth)
                                  ? "#2196F3"
                                  : "#bbb",
                              transform: [{ scale: (i + 1) / 5 }],
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
