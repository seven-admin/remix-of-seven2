import { Draggable } from '@hello-pangea/dnd';
import { KanbanCardWrapperProps } from './types';
import { cn } from '@/lib/utils';

export function KanbanCardWrapper({ id, index, children }: KanbanCardWrapperProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => {
        // Determinar estilo de transição baseado no estado
        const style = {
          ...provided.draggableProps.style,
          // Não interferir durante arrasto, animação suave no drop
          transition: snapshot.isDragging
            ? undefined // Deixar dnd controlar durante arrasto
            : snapshot.isDropAnimating
              ? 'all 0.15s cubic-bezier(0.2, 0, 0, 1)'
              : 'transform 0.15s ease',
        };

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "mb-2",
              snapshot.isDragging && "z-50 rotate-[2deg] scale-[1.02] shadow-2xl"
            )}
            style={style}
          >
            {children(snapshot.isDragging)}
          </div>
        );
      }}
    </Draggable>
  );
}
