import {
    createPageShape,
    deletePageShape,
    listPageShapes,
    PageShape,
    ShapeType,
    updatePageShape,
} from '@/src/db/dao';
import { useCallback, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';

export const usePageShapes = (
    currentPageId: string | null,
    canvasWidth: number = 0, 
    canvasHeight: number = 0 
) => {
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

        // VALIDAR POSICIÓN INICIAL AL AGREGAR
        let initialX = 150;
        let initialY = 200;
        const shapeWidth = 100;
        const shapeHeight = 100;
        if (canvasWidth > 0 && canvasHeight > 0) {
            initialX = Math.max(0, (canvasWidth - shapeWidth) / 2);
            initialY = Math.max(0, (canvasHeight - shapeHeight) / 2);
        }

        await createPageShape(
            currentPageId,
            selectedShapeType,
            selectedShapeColor,
            initialX,
            initialY,
            shapeWidth,
            shapeHeight,
        );

        await loadShapes(currentPageId);
    }, [currentPageId, selectedShapeType, selectedShapeColor, loadShapes, canvasWidth, canvasHeight]);

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

    // FUNCIÓN HELPER PARA VALIDAR LÍMITES
    const clampToCanvas = useCallback(
        (x: number, y: number, width: number, height: number) => {
            let clampedX = x;
            let clampedY = y;

            if (canvasWidth > 0) {
                clampedX = Math.max(0, Math.min(x, canvasWidth - width));
            }

            if (canvasHeight > 0) {
                clampedY = Math.max(0, Math.min(y, canvasHeight - height));
            }

            return { x: clampedX, y: clampedY };
        },
        [canvasWidth, canvasHeight]
    );

    // DUPLICACIÓN CON VALIDACIÓN DE LÍMITES
    const handleDuplicateShape = useCallback(
        async (shape: PageShape) => {
            if (!currentPageId) return;

            const offsetX = 20;
            const offsetY = 20;
            
            // Asegurar que width y height son números
            const shapeWidth = Number(shape.width) || 100;
            const shapeHeight = Number(shape.height) || 100;
            
            let newX = shape.position_x + offsetX;
            let newY = shape.position_y + offsetY;

            if (canvasWidth > 0 && canvasHeight > 0) {
                if (
                    newX + shapeWidth > canvasWidth ||
                    newY + shapeHeight > canvasHeight
                ) {
                    const alternatives = [
                        { x: shape.position_x - offsetX, y: shape.position_y + offsetY }, // Izquierda-abajo
                        { x: shape.position_x + offsetX, y: shape.position_y - offsetY }, // Derecha-arriba
                        { x: shape.position_x - offsetX, y: shape.position_y - offsetY }, // Izquierda-arriba
                        { x: shape.position_x, y: shape.position_y + offsetY },          // Centro-abajo
                        { x: shape.position_x + offsetX, y: shape.position_y },          // Derecha-centro
                    ];

                    let foundValid = false;
                    for (const alt of alternatives) {
                        if (
                            alt.x >= 0 &&
                            alt.y >= 0 &&
                            alt.x + shapeWidth <= canvasWidth &&
                            alt.y + shapeHeight <= canvasHeight
                        ) {
                            newX = alt.x;
                            newY = alt.y;
                            foundValid = true;
                            break;
                        }
                    }

                    if (!foundValid) {
                        newX = (canvasWidth - shapeWidth) / 2;
                        newY = (canvasHeight - shapeHeight) / 2;
                    }
                }

                // Aplicar límites finales 
                const clamped = clampToCanvas(newX, newY, shapeWidth, shapeHeight);
                newX = clamped.x;
                newY = clamped.y;
            }

            await createPageShape(
                currentPageId,
                shape.shape_type,
                shape.color,
                newX,  
                newY,  
                shapeWidth,
                shapeHeight,
            );

            await loadShapes(currentPageId);
        },
        [currentPageId, loadShapes, canvasWidth, canvasHeight, clampToCanvas],
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
        setLockedShapeIds,
    };
};