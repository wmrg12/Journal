import { StyleSheet } from "react-native";
import colors from "../constants/colors";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.primary,
    },
    fab: {
        position: "absolute",
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4, // solo Android
    },
    fabText: {
        color: colors.white,
        fontSize: 24,
        fontWeight: "700",
    },
});
