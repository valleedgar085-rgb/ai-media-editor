import React, { useRef, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { isVideoFile, isAudioFile } from '../../utils/thumbnailUtils';

const ItemTypes = {
  TIMELINE_ITEM: 'timelineItem',
};

/**
 * TimelineItem component - represents a single media item in the timeline
 * Supports drag and drop for reordering
 */
function TimelineItem({
  item,
  index,
  trackId,
  zoom,
  isSelected,
  onSelect,
  onRemove,
  onMove,
  onReorder,
}) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  
  // Calculate width based on duration and zoom
  const width = Math.max(80, item.duration * zoom);
  
  // Drag source
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TIMELINE_ITEM,
    item: () => ({
      id: item.id,
      index,
      trackId,
      startTime: item.startTime,
      duration: item.duration,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  // Drop target for reordering
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TIMELINE_ITEM,
    hover: (draggedItem, monitor) => {
      if (!ref.current) return;
      
      // Don't replace items with themselves
      if (draggedItem.id === item.id) return;
      
      // Only handle same-track reordering here
      if (draggedItem.trackId !== trackId) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // Only perform the move when the mouse has crossed half of the items width
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;
      
      // Time to actually perform the action
      onReorder(trackId, dragIndex, hoverIndex);
      
      // Update the index for the dragged item
      draggedItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  // Combine drag and drop refs
  drag(drop(ref));
  
  // Lazy load thumbnail
  useEffect(() => {
    if (item.thumbnail) {
      setThumbnailLoaded(true);
    }
  }, [item.thumbnail]);
  
  const isVideo = item.type === 'video' || isVideoFile(item.path);
  const isAudio = item.type === 'audio' || isAudioFile(item.path);
  
  // Format duration
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div
      ref={ref}
      className={`timeline-item-v2 ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-target' : ''}`}
      style={{
        width: `${width}px`,
        opacity: isDragging ? 0.5 : 1,
        left: `${item.startTime * zoom}px`,
      }}
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="timeline-item-thumbnail">
        {thumbnailLoaded && item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="thumbnail-image"
          />
        ) : (
          <div className="thumbnail-placeholder">
            {isVideo ? '🎥' : isAudio ? '🎵' : '🖼️'}
          </div>
        )}
      </div>
      
      {/* Info overlay */}
      <div className="timeline-item-info-v2">
        <span className="item-name" title={item.name}>
          {item.name}
        </span>
        <span className="item-duration">
          {formatTime(item.duration)}
        </span>
      </div>
      
      {/* Type indicator */}
      <div className="item-type-indicator">
        {isVideo ? '🎥' : isAudio ? '🎵' : '🖼️'}
      </div>
      
      {/* Remove button (visible on hover) */}
      {isHovered && (
        <button
          className="timeline-item-remove-v2"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(trackId, item.id);
          }}
          title="Remove from timeline"
        >
          ✕
        </button>
      )}
      
      {/* Resize handles */}
      <div className="resize-handle resize-handle-left" />
      <div className="resize-handle resize-handle-right" />
    </div>
  );
}

export default TimelineItem;
export { ItemTypes };
