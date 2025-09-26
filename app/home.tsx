import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import S from "./homeStyles";

export default function home() {
    const journalId = "debug-journal";

    return (
        <View style={S.container}>
            <Text style={S.title}>Home</Text>

            <Pressable
                style={S.fab}
                onPress={() =>
                    router.push({ pathname: "/pages/create", params: { journalId } })
                }
            >
                <Text style={S.fabText}>＋</Text>
            </Pressable>
        </View>
    )
}
