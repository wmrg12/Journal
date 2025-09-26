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
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
        dotWhite: {
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
        borderColor: "#000",
    },
    noColorSlash: {
        position: "absolute",
        width: 28,
        height: 2,
        backgroundColor: "#000",
        transform: [{ rotate: "-45deg" }],
        borderRadius: 1,
    },
    selected: {
        transform: [{ scale: 1.08 }],
        shadowOpacity: 0.35,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
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
    row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 6, // pequeño respiro a los lados
    }
});
