import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas as FabricCanvas, Polygon, Circle, FabricText, FabricImage, Shadow, Line, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MapaLegenda } from './MapaLegenda';
import { MapaUpload } from './MapaUpload';
import { useUpdateMapa, type MapaEmpreendimento } from '@/hooks/useMapaEmpreendimento';
import { useUpdateUnidade } from '@/hooks/useUnidades';
import { getPolygonColor, getPolygonColorWithOpacity, type PolygonCoords, type PolygonPoint, type DrawnItem, type MapaItemTipo } from '@/types/mapa.types';
import { buildUnitLabel, calculateLabelFontSize, groupUnidadesByBloco, type LabelFormatElement } from '@/lib/mapaUtils';
import type { Unidade } from '@/types/empreendimentos.types';
import {
  Loader2,
  Save,
  X,
  Pencil,
  MousePointer,
  Trash2,
  Image,
  Undo,
  Link as LinkIcon,
  Circle as CircleIcon,
  Copy,
  Check,
  ChevronsUpDown,
  Move,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MapaEditorProps {
  empreendimentoId: string;
  mapa: MapaEmpreendimento;
  unidades: Unidade[];
  labelFormato?: LabelFormatElement[];
  onClose: () => void;
}

type EditorTool = 'select' | 'draw_polygon' | 'draw_marker';

export function MapaEditor({ empreendimentoId, mapa, unidades, labelFormato = ['bloco', 'tipologia', 'numero'], onClose }: MapaEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const canvasInstanceIdRef = useRef(0);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [currentPoints, setCurrentPoints] = useState<PolygonPoint[]>([]);
  const [drawnItems, setDrawnItems] = useState<DrawnItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState<PolygonPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [markerRadius, setMarkerRadius] = useState(15);
  
  // Map Fabric objects to item IDs for drag tracking
  const objectToItemIdRef = useRef<Map<FabricObject, string>>(new Map());

  const updateMapa = useUpdateMapa();
  const updateUnidade = useUpdateUnidade();

  // Initialize existing items from unidades
  useEffect(() => {
    const existingItems: DrawnItem[] = [];
    unidades.forEach((unidade) => {
      if (unidade.polygon_coords) {
        const coords = unidade.polygon_coords as PolygonCoords;
        if (coords.points && coords.points.length >= 1) {
          const tipo: MapaItemTipo = coords.points.length === 1 ? 'marker' : 'polygon';
          existingItems.push({
            id: `existing-${unidade.id}`,
            tipo,
            points: coords.points,
            raio: tipo === 'marker' ? (coords.raio || 15) : undefined,
            unidadeId: unidade.id,
          });
        }
      }
    });
    setDrawnItems(existingItems);
  }, [unidades]);

  // Calculate responsive height
  const calculateCanvasHeight = () => {
    const headerHeight = 64;
    const toolbarHeight = 80;
    const padding = 48;
    const minHeight = 400;
    const availableHeight = window.innerHeight - headerHeight - toolbarHeight - padding;
    return Math.max(minHeight, availableHeight);
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    canvasInstanceIdRef.current += 1;

    const container = containerRef.current;
    const initialHeight = calculateCanvasHeight();
    
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.offsetWidth,
      height: initialHeight,
      backgroundColor: '#1a1a2e',
      selection: false,
    });

    setFabricCanvas(canvas);

    return () => {
      canvasInstanceIdRef.current += 1;
      setFabricCanvas(null);
      void canvas.dispose();
    };
  }, []);

  // Handle resize
  useEffect(() => {
    if (!fabricCanvas || !containerRef.current) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const newHeight = calculateCanvasHeight();
      fabricCanvas.setDimensions({
        width: container.offsetWidth,
        height: newHeight
      });
      fabricCanvas.requestRenderAll();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas]);

  // Load background image
  useEffect(() => {
    if (!fabricCanvas || !mapa?.imagem_url) return;

    const currentInstanceId = canvasInstanceIdRef.current;
    const canvas = fabricCanvas;

    FabricImage.fromURL(mapa.imagem_url, { crossOrigin: 'anonymous' }).then((img) => {
      if (canvasInstanceIdRef.current !== currentInstanceId) {
        return;
      }

      if (!canvas.lowerCanvasEl?.getContext('2d')) {
        return;
      }

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const scale = Math.min(
        canvasWidth / (img.width || 1),
        canvasHeight / (img.height || 1)
      );

      const offsetX = (canvasWidth - (img.width || 0) * scale) / 2;
      const offsetY = (canvasHeight - (img.height || 0) * scale) / 2;

      setImageScale(scale);
      setImageOffset({ x: offsetX, y: offsetY });

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: offsetX,
        top: offsetY,
        selectable: false,
        evented: false,
      });

      canvas.clear();
      canvas.add(img);
      canvas.sendObjectToBack(img);
      renderItems();
    }).catch((error) => {
      if (canvasInstanceIdRef.current === currentInstanceId) {
        console.error('Error loading map image:', error);
      }
    });
  }, [fabricCanvas, mapa?.imagem_url]);

  // Render items when they change
  useEffect(() => {
    if (fabricCanvas) {
      renderItems();
    }
  }, [drawnItems, fabricCanvas, imageScale, imageOffset, selectedItemId, activeTool, currentPoints, mousePosition]);

  // Mouse move, wheel (zoom), and pan handlers
  useEffect(() => {
    if (!fabricCanvas) return;

    let panning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleMouseMove = (e: any) => {
      // Pan handling
      if (panning) {
        const evt = e.e;
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPosX;
          vpt[5] += evt.clientY - lastPosY;
          fabricCanvas.requestRenderAll();
        }
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        return;
      }

      // Polygon drawing preview
      if (activeTool === 'draw_polygon' && currentPoints.length > 0) {
        const pointer = fabricCanvas.getViewportPoint(e.e);
        setMousePosition({
          x: (pointer.x - imageOffset.x) / imageScale,
          y: (pointer.y - imageOffset.y) / imageScale,
        });
      } else {
        setMousePosition(null);
      }
    };

    const handleMouseDown = (e: any) => {
      const evt = e.e;
      // Pan with middle mouse button or Alt+click
      if (evt.button === 1 || (evt.button === 0 && evt.altKey)) {
        panning = true;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        fabricCanvas.selection = false;
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
        evt.preventDefault();
        return;
      }
    };

    const handleMouseUp = () => {
      if (panning) {
        panning = false;
        fabricCanvas.selection = false;
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      }
    };

    // Zoom with mouse wheel
    const handleWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 4) zoom = 4;
      if (zoom < 0.3) zoom = 0.3;
      
      const pointer = fabricCanvas.getViewportPoint(opt.e);
      fabricCanvas.zoomToPoint(pointer, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      setZoomLevel(zoom);
    };

    // Handle object modified (drag-and-drop repositioning)
    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj) return;

      const itemId = objectToItemIdRef.current.get(obj);
      if (!itemId) return;

      const item = drawnItems.find(i => i.id === itemId);
      if (!item) return;

      // Get the new position in original coordinates
      const vpt = fabricCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const zoom = fabricCanvas.getZoom();

      if (item.tipo === 'marker') {
        // For circles, get center position
        const raio = item.raio || 15;
        const newLeft = obj.left ?? 0;
        const newTop = obj.top ?? 0;
        
        // Convert back to original coordinates
        const originalX = ((newLeft + raio - vpt[4]) / zoom - imageOffset.x) / imageScale;
        const originalY = ((newTop + raio - vpt[5]) / zoom - imageOffset.y) / imageScale;

        setDrawnItems(prev => prev.map(i => 
          i.id === itemId 
            ? { ...i, points: [{ x: originalX, y: originalY }] }
            : i
        ));
      } else {
        // For polygons, this is more complex - need to track all points
        // For now, get the bounding rect center offset
        const origCenter = item.points.reduce(
          (acc, p) => ({ x: acc.x + p.x / item.points.length, y: acc.y + p.y / item.points.length }),
          { x: 0, y: 0 }
        );
        
        const newCenterScaled = { x: obj.left ?? 0, y: obj.top ?? 0 };
        const newCenterX = ((newCenterScaled.x - vpt[4]) / zoom - imageOffset.x) / imageScale;
        const newCenterY = ((newCenterScaled.y - vpt[5]) / zoom - imageOffset.y) / imageScale;
        
        // Calculate offset and apply to all points
        const offsetX = newCenterX - origCenter.x;
        const offsetY = newCenterY - origCenter.y;

        setDrawnItems(prev => prev.map(i => 
          i.id === itemId 
            ? { ...i, points: i.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY })) }
            : i
        ));
      }
    };

    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:up', handleMouseUp);
    fabricCanvas.on('mouse:wheel', handleWheel);
    fabricCanvas.on('object:modified', handleObjectModified);

    return () => {
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:up', handleMouseUp);
      fabricCanvas.off('mouse:wheel', handleWheel);
      fabricCanvas.off('object:modified', handleObjectModified);
    };
  }, [fabricCanvas, activeTool, currentPoints.length, imageScale, imageOffset, drawnItems]);

  const renderItems = useCallback(() => {
    if (!fabricCanvas) return;

    // Clear object to ID mapping
    objectToItemIdRef.current.clear();

    // Remove existing items (keep background)
    const objects = fabricCanvas.getObjects();
    const toRemove = objects.filter((obj) => obj !== objects[0]);
    toRemove.forEach((obj) => fabricCanvas.remove(obj));

    // Draw items
    drawnItems.forEach((item) => {
      const unidade = unidades.find((u) => u.id === item.unidadeId);
      const status = unidade?.status || 'disponivel';

      if (item.tipo === 'marker') {
        const center = item.points[0];
        const raio = item.raio || 15;
        const isSelected = selectedItemId === item.id;
        
        const marker = new Circle({
          left: center.x * imageScale + imageOffset.x - raio,
          top: center.y * imageScale + imageOffset.y - raio,
          radius: raio,
          fill: isSelected
            ? getPolygonColorWithOpacity(status, 0.8)
            : getPolygonColorWithOpacity(status, 0.5),
          stroke: isSelected ? '#ffffff' : getPolygonColor(status),
          strokeWidth: isSelected ? 3 : 2,
          selectable: activeTool === 'select',
          hasControls: false,
          hasBorders: isSelected,
          hoverCursor: 'pointer',
          moveCursor: 'move',
        });

        fabricCanvas.add(marker);
        objectToItemIdRef.current.set(marker, item.id);

        // Label
        const labelText = unidade ? buildUnitLabel(unidade, labelFormato) : '?';
        const fontSize = calculateLabelFontSize(labelText, raio);
        const textShadow = new Shadow({
          color: 'rgba(0,0,0,0.8)',
          blur: 2,
          offsetX: 1,
          offsetY: 1,
        });

        const label = new FabricText(labelText, {
          left: center.x * imageScale + imageOffset.x,
          top: center.y * imageScale + imageOffset.y,
          fontSize,
          fill: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '300',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          shadow: textShadow,
        });

        fabricCanvas.add(label);

        const itemId = item.id;
        marker.on('mousedown', (e: any) => {
          // Don't select if panning
          if (e.e?.altKey || e.e?.button === 1) return;
          if (activeTool === 'select') {
            setSelectedItemId(itemId);
          }
        });
      } else {
        // Draw polygon
        const scaledPoints = item.points.map((p) => ({
          x: p.x * imageScale + imageOffset.x,
          y: p.y * imageScale + imageOffset.y,
        }));

        const isSelected = selectedItemId === item.id;
        const polygon = new Polygon(scaledPoints, {
          fill: isSelected
            ? getPolygonColorWithOpacity(status, 0.8)
            : getPolygonColorWithOpacity(status, 0.5),
          stroke: isSelected ? '#ffffff' : getPolygonColor(status),
          strokeWidth: isSelected ? 3 : 2,
          selectable: activeTool === 'select',
          hasControls: false,
          hasBorders: isSelected,
          hoverCursor: 'pointer',
          moveCursor: 'move',
        });

        fabricCanvas.add(polygon);
        objectToItemIdRef.current.set(polygon, item.id);

        // Add label at center
        const centerX = scaledPoints.reduce((sum, p) => sum + p.x, 0) / scaledPoints.length;
        const centerY = scaledPoints.reduce((sum, p) => sum + p.y, 0) / scaledPoints.length;

        const labelText = unidade ? buildUnitLabel(unidade, labelFormato) : 'Sem vínculo';
        const fontSize = calculateLabelFontSize(labelText);
        const textShadow = new Shadow({
          color: 'rgba(0,0,0,0.8)',
          blur: 2,
          offsetX: 1,
          offsetY: 1,
        });

        const label = new FabricText(labelText, {
          left: centerX,
          top: centerY,
          fontSize,
          fill: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '300',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          shadow: textShadow,
        });

        fabricCanvas.add(label);

        const itemId = item.id;
        polygon.on('mousedown', (e: any) => {
          if (e.e?.altKey || e.e?.button === 1) return;
          if (activeTool === 'select') {
            setSelectedItemId(itemId);
          }
        });
      }
    });

    // Draw current drawing points for polygon mode
    if (currentPoints.length > 0 && activeTool === 'draw_polygon') {
      currentPoints.forEach((point, index) => {
        const circle = new Circle({
          left: point.x * imageScale + imageOffset.x - 5,
          top: point.y * imageScale + imageOffset.y - 5,
          radius: 5,
          fill: '#3b82f6',
          stroke: '#ffffff',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(circle);

        if (index > 0) {
          const prevPoint = currentPoints[index - 1];
          const line = new Line([
            prevPoint.x * imageScale + imageOffset.x,
            prevPoint.y * imageScale + imageOffset.y,
            point.x * imageScale + imageOffset.x,
            point.y * imageScale + imageOffset.y,
          ], {
            stroke: '#3b82f6',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          });
          fabricCanvas.add(line);
        }
      });

      if (mousePosition && currentPoints.length > 0) {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const tempLine = new Line([
          lastPoint.x * imageScale + imageOffset.x,
          lastPoint.y * imageScale + imageOffset.y,
          mousePosition.x * imageScale + imageOffset.x,
          mousePosition.y * imageScale + imageOffset.y,
        ], {
          stroke: '#3b82f6',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(tempLine);
      }
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, drawnItems, currentPoints, selectedItemId, activeTool, unidades, imageScale, imageOffset, mousePosition]);

  // Canvas click handler for drawing
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleClick = (e: any) => {
      // Ignore if panning
      if (e.e?.altKey || e.e?.button === 1) return;
      
      // Ignore clicks on existing objects in select mode
      if (activeTool === 'select' && e.target) return;

      const pointer = fabricCanvas.getViewportPoint(e.e);
      const vpt = fabricCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const zoom = fabricCanvas.getZoom();
      
      // Convert viewport point to canvas point accounting for zoom and pan
      const x = ((pointer.x - vpt[4]) / zoom - imageOffset.x) / imageScale;
      const y = ((pointer.y - vpt[5]) / zoom - imageOffset.y) / imageScale;

      if (activeTool === 'draw_polygon') {
        setCurrentPoints((prev) => [...prev, { x, y }]);
      } else if (activeTool === 'draw_marker') {
        const newMarker: DrawnItem = {
          id: `marker-${Date.now()}`,
          tipo: 'marker',
          points: [{ x, y }],
          raio: markerRadius,
        };
        setDrawnItems((prev) => [...prev, newMarker]);
        setSelectedItemId(newMarker.id);
        toast.success('Marcador criado! Vincule a uma unidade.');
      }
    };

    fabricCanvas.on('mouse:down', handleClick);

    return () => {
      fabricCanvas.off('mouse:down', handleClick);
    };
  }, [fabricCanvas, activeTool, imageScale, imageOffset, markerRadius]);

  const handleFinishPolygon = () => {
    if (currentPoints.length < 3) {
      toast.error('Desenhe pelo menos 3 pontos para criar um polígono');
      return;
    }

    const newItem: DrawnItem = {
      id: `polygon-${Date.now()}`,
      tipo: 'polygon',
      points: [...currentPoints],
    };

    setDrawnItems((prev) => [...prev, newItem]);
    setCurrentPoints([]);
    setSelectedItemId(newItem.id);
    setActiveTool('select');
    toast.success('Polígono criado! Agora vincule a uma unidade.');
  };

  const handleDeleteItem = () => {
    if (!selectedItemId) return;

    setDrawnItems((prev) => prev.filter((p) => p.id !== selectedItemId));
    setSelectedItemId(null);
    toast.success('Item removido');
  };

  const handleDuplicateItem = () => {
    if (!selectedItemId) return;

    const item = drawnItems.find(i => i.id === selectedItemId);
    if (!item) return;

    const offset = 30 / imageScale; // 30px offset in screen coordinates
    const newItem: DrawnItem = {
      id: `${item.tipo}-${Date.now()}`,
      tipo: item.tipo,
      points: item.points.map(p => ({ x: p.x + offset, y: p.y + offset })),
      raio: item.raio,
      // Don't copy unidadeId - new item needs to be linked manually
    };

    setDrawnItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    toast.success('Item duplicado! Posicione e vincule a uma unidade.');
  };

  // Keyboard handler for Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId && activeTool === 'select') {
        if (e.key === 'Backspace') {
          e.preventDefault();
        }
        handleDeleteItem();
      }
      // Ctrl+D or Cmd+D to duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedItemId && activeTool === 'select') {
        e.preventDefault();
        handleDuplicateItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, activeTool]);

  const handleLinkUnidade = (unidadeId: string) => {
    if (!selectedItemId || !unidadeId) return;

    setDrawnItems((prev) =>
      prev.map((p) =>
        p.id === selectedItemId ? { ...p, unidadeId } : p
      )
    );

    setLinkPopoverOpen(false);
    toast.success('Unidade vinculada');
  };

  const handleUndo = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints((prev) => prev.slice(0, -1));
    }
  };

  const handleUpdateSelectedRadius = (newRadius: number) => {
    if (!selectedItemId) return;
    setDrawnItems(prev => prev.map(item => 
      item.id === selectedItemId ? { ...item, raio: newRadius } : item
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save coordinates to each linked unidade, including raio
      for (const item of drawnItems) {
        if (item.unidadeId) {
          const coordsToSave: PolygonCoords = {
            points: item.points,
            ...(item.tipo === 'marker' && item.raio ? { raio: item.raio } : {}),
          };
          
          await updateUnidade.mutateAsync({
            id: item.unidadeId,
            empreendimentoId,
            data: {
              polygon_coords: coordsToSave,
            },
          });
        }
      }

      // Clear from unidades that no longer have items
      const linkedUnidadeIds = drawnItems.map((p) => p.unidadeId).filter(Boolean);
      for (const unidade of unidades) {
        if (unidade.polygon_coords && !linkedUnidadeIds.includes(unidade.id)) {
          await updateUnidade.mutateAsync({
            id: unidade.id,
            empreendimentoId,
            data: { polygon_coords: null },
          });
        }
      }

      toast.success('Mapa salvo com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error saving map:', error);
      toast.error('Erro ao salvar mapa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapaUpload = async (url: string, width: number, height: number) => {
    try {
      await updateMapa.mutateAsync({
        id: mapa.id,
        empreendimentoId,
        data: { imagem_url: url, largura: width, altura: height },
      });
      setShowUpload(false);
    } catch (error) {
      console.error('Error updating map image:', error);
    }
  };

  const unlinkedUnidades = useMemo(() => 
    unidades.filter((u) => !drawnItems.some((p) => p.unidadeId === u.id)),
    [unidades, drawnItems]
  );

  const groupedUnidades = useMemo(() => 
    groupUnidadesByBloco(unlinkedUnidades),
    [unlinkedUnidades]
  );

  const selectedItem = drawnItems.find((p) => p.id === selectedItemId);

  if (showUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alterar Imagem do Mapa</CardTitle>
        </CardHeader>
        <CardContent>
          <MapaUpload
            empreendimentoId={empreendimentoId}
            onUploadComplete={handleMapaUpload}
            onCancel={() => setShowUpload(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={activeTool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool('select');
              setCurrentPoints([]);
              setMousePosition(null);
            }}
          >
            <MousePointer className="h-4 w-4 mr-2" />
            Selecionar
          </Button>
          <Button
            variant={activeTool === 'draw_polygon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool('draw_polygon');
              setCurrentPoints([]);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Polígono
          </Button>
          <Button
            variant={activeTool === 'draw_marker' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTool('draw_marker');
              setCurrentPoints([]);
              setMousePosition(null);
            }}
          >
            <CircleIcon className="h-4 w-4 mr-2" />
            Marcador
          </Button>

          {/* Marker radius when drawing */}
          {activeTool === 'draw_marker' && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <Label className="text-sm whitespace-nowrap">Raio:</Label>
              <Input
                type="number"
                min={5}
                max={50}
                value={markerRadius}
                onChange={(e) => setMarkerRadius(parseInt(e.target.value) || 15)}
                className="w-20 h-8"
              />
            </div>
          )}

          {/* Zoom and pan indicator */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
            <span className="text-sm text-muted-foreground">
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3" />
              Alt+Arrastar
            </span>
          </div>

          {activeTool === 'draw_polygon' && currentPoints.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleUndo}>
                <Undo className="h-4 w-4 mr-2" />
                Desfazer
              </Button>
              <Button size="sm" onClick={handleFinishPolygon} disabled={currentPoints.length < 3}>
                Finalizar ({currentPoints.length} pontos)
              </Button>
            </>
          )}

          {activeTool === 'select' && selectedItemId && (
            <>
              {/* Edit radius for selected marker */}
              {selectedItem?.tipo === 'marker' && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                  <Label className="text-sm whitespace-nowrap">Raio:</Label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={selectedItem.raio || 15}
                    onChange={(e) => handleUpdateSelectedRadius(parseInt(e.target.value) || 15)}
                    className="w-20 h-8"
                  />
                </div>
              )}

              {/* Link button with searchable combobox */}
              <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={unlinkedUnidades.length === 0 && !selectedItem?.unidadeId}
                    className="ml-2"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Vincular
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar unidade..." />
                    <CommandList className="max-h-64">
                      <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                      {Array.from(groupedUnidades.entries()).map(([blocoNome, units]) => (
                        <CommandGroup key={blocoNome} heading={blocoNome}>
                          {units.map((unidade) => (
                            <CommandItem
                              key={unidade.id}
                              value={`${blocoNome} ${unidade.numero} ${unidade.posicao || ''} ${unidade.tipologia?.nome || ''}`}
                              onSelect={() => handleLinkUnidade(unidade.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedItem?.unidadeId === unidade.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{unidade.numero}</span>
                                <span className="text-xs text-muted-foreground">
                                  {[unidade.posicao, unidade.tipologia?.nome].filter(Boolean).join(' • ')}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="sm" onClick={handleDuplicateItem}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteItem}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
            <Image className="h-4 w-4 mr-2" />
            Alterar Imagem
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Instructions */}
      {activeTool === 'draw_polygon' && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
          <strong>Modo Polígono:</strong> Clique para adicionar pontos. Mínimo 3 pontos. Clique "Finalizar" quando terminar.
        </div>
      )}
      {activeTool === 'draw_marker' && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          <strong>Modo Marcador:</strong> Clique no mapa para criar um marcador circular. Depois vincule a uma unidade.
        </div>
      )}
      {activeTool === 'select' && (
        <div className="p-3 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground">
          <strong>Dica:</strong> Arraste para mover itens. <kbd className="px-1 bg-muted rounded">Ctrl+D</kbd> duplicar. <kbd className="px-1 bg-muted rounded">Delete</kbd> excluir. <kbd className="px-1 bg-muted rounded">Alt+Arrastar</kbd> mover mapa.
        </div>
      )}

      <MapaLegenda />

      {/* Canvas */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <div ref={containerRef} className="w-full">
            <canvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Polígonos: {drawnItems.filter(i => i.tipo === 'polygon').length}</span>
        <span>Marcadores: {drawnItems.filter(i => i.tipo === 'marker').length}</span>
        <span>Vinculados: {drawnItems.filter((p) => p.unidadeId).length}</span>
        <span>Unidades sem vínculo: {unlinkedUnidades.length}</span>
      </div>
    </div>
  );
}
