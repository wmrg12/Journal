import { useState, useCallback, useRef } from 'react';
import { Alert, Animated } from 'react-native';
import {
    createPageShape,
    listPageShapes,
    updatePageShape,
    deletePageShape,
    PageShape,
    ShapeType,
} from '@/src/db/dao';

export const usePageShapes = (currentPageId: string | null) => {
    const [pageShapes, setPageShapes] = useState<PageShape[]>([]);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [lockedShapeIds, setLockedShapeIds] = useState<Record<string, boolean>>({});
    const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('circle');
    const [selectedShapeColor, setSelectedShapeColor] = useState('#FF6B6B');

    const panShapesRef = useRef(new Map<string, Animated.ValueXY>());

    const getPanForShape = useCallback((s: PageShape) => {
    let pan = panShapesRef.current.get(s.id);
    if (!pan) {
        pan = new Animated.ValueXY({ x: s.position_x, y: s.position_y });
        panShapesRef.current.set(s.id, pan);
    }
    return pan;
    }, []);

    const loadShapes = useCallback(async (pageId: string) => {
    try {
        const shapes = await listPageShapes(pageId);
        setPageShapes(shapes);

        const lockedState: Record<string, boolean> = {};
        shapes.forEach((shape) => {
        if (shape.is_locked) {
            lockedState[shape.id] = true;
        }
        });
        setLockedShapeIds(lockedState);
    } catch (e) {
        console.error('Error loading shapes:', e);
        setPageShapes([]);
    }
    }, []);

    const commitShapePosition = useCallback((id: string, x: number, y: number) => {
    setPageShapes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, position_x: x, position_y: y } : s)),
    );
    }, []);

    const handleAddShape = useCallback(async () => {
    if (!currentPageId) return;

    await createPageShape(
        currentPageId,
        selectedShapeType,
        selectedShapeColor,
        150,
        200,
        100,
        100,
    );

    await loadShapes(currentPageId);
    }, [currentPageId, selectedShapeType, selectedShapeColor, loadShapes]);

    const handleDeleteShape = useCallback(
    async (shapeId: string) => {
        if (!currentPageId) return;

        Alert.alert('Eliminar forma', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
            setPageShapes((prev) => prev.filter((s) => s.id !== shapeId));
            panShapesRef.current.delete(shapeId);
            setLockedShapeIds((prev) => {
                const copy = { ...prev };
                delete copy[shapeId];
                return copy;
            });
            setSelectedShapeId((prev) => (prev === shapeId ? null : prev));

            await deletePageShape(shapeId);
            },
        },
        ]);
    },
    [currentPageId],
    );

    const handleToggleLock = useCallback(
    async (id: string) => {
        setLockedShapeIds((prev) => {
        const newLocked = !prev[id];
        if (currentPageId) {
            updatePageShape(id, { is_locked: newLocked ? 1 : 0 });
        }
        return { ...prev, [id]: newLocked };
        });
    },
    [currentPageId],
    );

    const handleDuplicateShape = useCallback(
    async (shape: PageShape) => {
        if (!currentPageId) return;

        await createPageShape(
        currentPageId,
        shape.shape_type,
        shape.color,
        shape.position_x + 20,
        shape.position_y + 20,
        shape.width,
        shape.height,
        );

        await loadShapes(currentPageId);
    },
    [currentPageId, loadShapes],
    );

    return {
    pageShapes,
    selectedShapeId,
    setSelectedShapeId,
    lockedShapeIds,
    selectedShapeType,
    setSelectedShapeType,
    selectedShapeColor,
    setSelectedShapeColor,
    getPanForShape,
    loadShapes,
    commitShapePosition,
    handleAddShape,
    handleDeleteShape,
    handleToggleLock,
    handleDuplicateShape,
    };
};