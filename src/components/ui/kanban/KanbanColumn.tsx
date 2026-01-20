import { Droppable } from '@hello-pangea/dnd';
import { KanbanCardWrapper } from './KanbanCard';
import { KanbanColumnProps } from './types';
import { cn } from '@/lib/utils';

export function KanbanColumn<T>({
  column,
  items,
  getItemId,
  renderCard,
  emptyMessage = 'Nenhum item',
  renderHeader,
  className
}: KanbanColumnProps<T>) {
  return (
    <div
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-lg border bg-muted/30",
        className
      )}
      style={{ backgroundColor: column.bgColor }}
    >
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        {renderHeader ? (
          renderHeader(column, items.length, items)
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {column.color && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: column.color }}
                />
              )}
              <h3 className="font-medium text-sm">{column.title}</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
        )}
      </div>

      {/* Droppable Area - Sem ScrollArea para performance */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-2 overflow-y-auto min-h-[200px] rounded-b-lg transition-colors duration-150",
              snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-inset ring-primary/30"
            )}
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            {items.map((item, index) => (
              <KanbanCardWrapper 
                key={getItemId(item)} 
                id={getItemId(item)} 
                index={index}
              >
                {(isDragging) => renderCard(item, isDragging)}
              </KanbanCardWrapper>
            ))}
            {provided.placeholder}
            
            {items.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
