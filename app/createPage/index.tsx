import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {color} from "@/constants/colors";
import S from "./createStyles"

type Props = { navigation: any; route: { params?: { journalId?: string } } };

const toRows = <T,>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );

export default function CreatePageScreen({ navigation, route }: Props) {
   // journalId debe venir desde "Crear Diario"
    const { journalId } = useLocalSearchParams<{ journalId?: string }>();
    const jId = typeof journalId === "string" && journalId.length > 0
    ? journalId
    : "debug-journal";

    const [bgColor, setBgColor] = useState(color.pageColors[0]);

    function handleCreatePage() {
        console.log("Crear página — color:", bgColor, "journal:", jId);
    }

    const rows = toRows(color.pageColors, 5);

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
                        opacity: bgColor === color.white ? 1 : 0.95,
                    }}
                />
        </View>

            <Text style={S.label}>Color</Text>

            {rows.map((row, idx) => (
                <View key={idx} style={S.row}>
                    {row.map((c) => {
                        const isWhite = c === color.white;
                            const isSelected = bgColor === c;

        return (
            <Pressable
                key={c}
                onPress={() => setBgColor(c)}
                    style={[
                        S.dot,
                        isWhite ? S.dotWhite : { backgroundColor: c },
                        isSelected && S.selected,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Color ${isWhite ? "blanco (sin color)" : c}`}
                    accessibilityState={{ selected: isSelected }}
                >
                    {isWhite && <View style={S.noColorSlash} />}
                </Pressable>
            );
        })}
    </View>
))}

            <Pressable style={S.cta} onPress={handleCreatePage}>
                <Text style={S.ctaText}>Crear Nueva Página</Text>
            </Pressable>
    </View>
    );
}
