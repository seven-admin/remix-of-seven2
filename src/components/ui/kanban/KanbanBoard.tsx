import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanColumn } from './KanbanColumn';
import { KanbanBoardProps, KanbanColumn as ColumnType } from './types';

export function KanbanBoard<T>({
  columns,
  items,
  getItemId,
  getItemColumn,
  renderCard,
  onMove,
  onMoveWithData,
  isLoading,
  emptyMessage,
  renderColumnHeader
}: KanbanBoardProps<T>) {
  
  const getItemsByColumn = (columnId: string): T[] => {
    return items.filter(item => getItemColumn(item) === columnId);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the item that was dragged
    const draggedItem = items.find(item => getItemId(item) === draggableId);
    
    if (onMoveWithData && draggedItem) {
      onMoveWithData(draggedItem, source.droppableId, destination.droppableId);
    } else {
      onMove(draggableId, source.droppableId, destination.droppableId, destination.index);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 p-1 pb-4">
        {columns.map((column) => (
          <div key={column.id} className="w-72 shrink-0 rounded-lg border bg-muted/30 p-3">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-4 p-1 min-w-max">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              items={getItemsByColumn(column.id)}
              getItemId={getItemId}
              renderCard={renderCard}
              emptyMessage={emptyMessage}
              renderHeader={renderColumnHeader}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}
