import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import TimelineItem, { ItemTypes } from './TimelineItem';

/**
 * TimelineTrack component - represents a single track in the timeline
 * Supports receiving dropped items from other tracks
 */
function TimelineTrack({
  track,
  zoom,
  selectedItemId,
  duration,
  onSelectItem,
  onRemoveItem,
  onMoveItem,
  onReorderItems,
  onMoveItemToTrack,
}) {
  const trackRef = useRef(null);
  
  // Calculate track width based on duration and zoom
  const trackWidth = Math.max(1000, duration * zoom + 200);
  
  // Drop target for receiving items from other tracks
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TIMELINE_ITEM,
    canDrop: (draggedItem) => {
      // Allow dropping from other tracks
      return draggedItem.trackId !== track.id;
    },
    drop: (draggedItem, monitor) => {
      if (draggedItem.trackId === track.id) return;
      
      // Calculate drop position based on mouse position
      const clientOffset = monitor.getClientOffset();
      const trackRect = trackRef.current?.getBoundingClientRect();
      
      if (trackRect && clientOffset) {
        const dropX = clientOffset.x - trackRect.left;
        const newStartTime = Math.max(0, dropX / zoom);
        
        onMoveItemToTrack(draggedItem.trackId, track.id, draggedItem.id, newStartTime);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });
  
  drop(trackRef);
  
  const isDropTarget = isOver && canDrop;
  
  return (
    <div
      className={`timeline-track-v2 ${track.type}-track ${isDropTarget ? 'drop-active' : ''}`}
    >
      {/* Track label */}
      <div className="track-label">
        <span className="track-icon">
          {track.type === 'video' ? '🎬' : track.type === 'audio' ? '🎵' : '📁'}
        </span>
        <span className="track-name">{track.name}</span>
      </div>
      
      {/* Track content area */}
      <div
        ref={trackRef}
        className="track-content"
        style={{ width: `${trackWidth}px` }}
      >
        {/* Grid lines */}
        <div className="track-grid">
          {Array.from({ length: Math.ceil(trackWidth / (zoom * 10)) }).map((_, i) => (
            <div
              key={i}
              className="grid-line"
              style={{ left: `${i * zoom * 10}px` }}
            />
          ))}
        </div>
        
        {/* Track items */}
        <div className="track-items">
          {track.items.map((item, index) => (
            <TimelineItem
              key={item.id}
              item={item}
              index={index}
              trackId={track.id}
              zoom={zoom}
              isSelected={selectedItemId === item.id}
              onSelect={onSelectItem}
              onRemove={onRemoveItem}
              onMove={onMoveItem}
              onReorder={onReorderItems}
            />
          ))}
        </div>
        
        {/* Drop indicator */}
        {isDropTarget && (
          <div className="drop-indicator">
            <span>Drop here to add to {track.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineTrack;
