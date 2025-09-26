import { StyleSheet } from "react-native";
import colors from "../../constants/colors";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
        gap: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.primary,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.primary,
        marginTop: 8,
    },
    preview: {
        width: "100%",
        aspectRatio: 1.2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#00000022",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    colors: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginVertical: 10,
        },
    dot: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderColor: "#2223",
    },
    selected: {
        transform: [{ scale: 1.08 }],
        shadowOpacity: 0.35,
    },
    cta: {
        marginTop: "auto",
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: "center",
    },
    ctaText: {
        color: colors.white,
        fontWeight: "700",
    },
});
