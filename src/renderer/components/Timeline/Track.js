import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './constants';
import TrackItem from './TrackItem';

function Track({ 
  track, 
  zoom, 
  selectedItemId, 
  onSelectItem, 
  onRemoveItem,
  onReorderItems,
  onFileDrop
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.TIMELINE_ITEM,
    drop: (draggedItem, monitor) => {
      // Handle dropping from outside the track (future cross-track drops)
      if (draggedItem.trackId !== track.id) {
        // Cross-track functionality to be implemented
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const trackIcon = track.type === 'video' ? '🎬' : '🎵';
  const isEmpty = track.items.length === 0;

  return (
    <div 
      ref={drop}
      className={`track ${track.type}-track ${isOver && canDrop ? 'drop-target' : ''}`}
    >
      <div className="track-header">
        <span className="track-icon">{trackIcon}</span>
        <span className="track-name">{track.name}</span>
        <span className="track-item-count">{track.items.length} item(s)</span>
      </div>
      
      <div 
        className={`track-content ${isEmpty ? 'empty' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (onFileDrop && e.dataTransfer.files.length > 0) {
            onFileDrop(track.id, Array.from(e.dataTransfer.files));
          }
        }}
      >
        {isEmpty ? (
          <div className="track-empty-placeholder">
            Drop {track.type === 'audio' ? 'audio files' : 'media files'} here
          </div>
        ) : (
          <div className="track-items-container">
            {track.items.map((item, index) => (
              <TrackItem
                key={item.id}
                item={item}
                index={index}
                trackId={track.id}
                zoom={zoom}
                isSelected={selectedItemId === item.id}
                onSelect={onSelectItem}
                onRemove={onRemoveItem}
                onReorder={onReorderItems}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Track;
