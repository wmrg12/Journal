import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import colors from "../../constants/colors";
import S from "./createStyles"

type Props = { navigation: any; route: { params?: { journalId?: string } } };


export default function CreatePageScreen({ navigation, route }: Props) {
   // journalId debe venir desde "Crear Diario"
    const journalId = route.params?.journalId ?? "debug-journal";
    const [bgColor, setBgColor] = useState(colors.pageColors[0]);

    function handleCreatePage() {
        console.log("Crear página — color:", bgColor, "journal:", journalId);
    }

    return (
        <View style={S.container}>
            <Text style={S.title}>Crear Página</Text>

            <Text style={S.label}>Vista Previa</Text>
            <View style={[S.preview, { backgroundColor: bgColor }]}>
                <Image
                    source={require("../../assets/images/notebook-open.png")}
                    resizeMode="contain"
                    style={{
                        width: "100%",
                        height: "100%",
                        opacity: bgColor === colors.white ? 1 : 0.95,
                    }}
                />
            </View>

            <Text style={S.label}>Color</Text>
            <View style={S.colors}>
                {colors.pageColors.map((c) => (
                    <Pressable
                        key={c}
                        onPress={() => setBgColor(c)}
                        style={[
                            S.dot,
                            { backgroundColor: c, borderWidth: c === colors.white ? 1 : 0 },
                            bgColor === c && S.selected,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Color ${c === colors.white ? "blanco (sin color)" : c}`}
                        accessibilityState={{ selected: bgColor === c }}
                    />
                ))}
            </View>

            <Pressable style={S.cta} onPress={handleCreatePage}>
        <Text style={S.ctaText}>Crear Nueva Página</Text>
            </Pressable>
    </View>
    );
}
