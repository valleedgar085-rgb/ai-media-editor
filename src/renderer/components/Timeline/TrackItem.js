import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes } from './constants';

function TrackItem({ 
  item, 
  index, 
  trackId,
  zoom, 
  isSelected, 
  onSelect, 
  onRemove,
  onReorder
}) {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TIMELINE_ITEM,
    item: () => ({ 
      id: item.id, 
      index, 
      trackId,
      type: item.type 
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TIMELINE_ITEM,
    hover: (draggedItem, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      const sourceTrackId = draggedItem.trackId;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceTrackId === trackId) return;
      
      // Only allow reordering within the same track for now
      if (sourceTrackId !== trackId) return;
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // Only perform the move when the mouse has crossed half of the items width
      // When dragging right, only move when the cursor is past 50%
      // When dragging left, only move when the cursor is before 50%
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;
      
      // Time to actually perform the action
      onReorder(trackId, dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      draggedItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  drag(drop(ref));

  // Calculate width based on duration and zoom
  const width = Math.max(item.duration * zoom, 60); // minimum 60px

  const opacity = isDragging ? 0.4 : 1;
  const borderColor = isOver && canDrop ? '#e94560' : isSelected ? '#e94560' : 'transparent';

  return (
    <div
      ref={ref}
      className={`track-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ 
        width: `${width}px`,
        opacity,
        borderColor
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      <div className="track-item-thumbnail">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.name} />
        ) : (
          <div className="track-item-icon">
            {item.type === 'video' ? '🎥' : item.type === 'audio' ? '🎵' : '🖼️'}
          </div>
        )}
      </div>
      <div className="track-item-info">
        <span className="track-item-name" title={item.name}>
          {item.name}
        </span>
        <span className="track-item-duration">
          {formatDuration(item.duration)}
        </span>
      </div>
      <button
        className="track-item-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(trackId, item.id);
        }}
        title="Remove from timeline"
      >
        ✕
      </button>
    </div>
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default TrackItem;
