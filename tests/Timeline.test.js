import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TimelineEditor } from '../src/renderer/components/Timeline';
import ZoomControls from '../src/renderer/components/Timeline/ZoomControls';
import TrackItem from '../src/renderer/components/Timeline/TrackItem';

// Wrapper component for DnD context
const DndWrapper = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

describe('TimelineEditor', () => {
  const defaultProps = {
    tracks: [
      { 
        id: 'video-track', 
        type: 'video', 
        name: 'Video Track', 
        items: [
          {
            id: 'item-1',
            name: 'test-video.mp4',
            path: 'blob:mock-url',
            type: 'video',
            duration: 10,
            startTime: 0,
            thumbnail: null
          }
        ] 
      },
      { id: 'audio-track', type: 'audio', name: 'Audio Track', items: [] }
    ],
    zoom: 50,
    currentTime: 0,
    duration: 10,
    isPlaying: false,
    selectedItemId: null,
    onSelectItem: jest.fn(),
    onRemoveItem: jest.fn(),
    onReorderItems: jest.fn(),
    onZoomChange: jest.fn(),
    onTimeChange: jest.fn(),
    onFileDrop: jest.fn()
  };

  it('renders timeline with tracks', () => {
    render(<TimelineEditor {...defaultProps} />);
    
    expect(screen.getByText('Video Track')).toBeInTheDocument();
    expect(screen.getByText('Audio Track')).toBeInTheDocument();
  });

  it('displays current time', () => {
    render(<TimelineEditor {...defaultProps} currentTime={5.5} />);
    
    // Time should be formatted as 0:05.50
    expect(screen.getByText('0:05.50')).toBeInTheDocument();
  });

  it('displays duration', () => {
    render(<TimelineEditor {...defaultProps} duration={120} />);
    
    // Duration should be formatted as / 2:00.00
    expect(screen.getByText('/ 2:00.00')).toBeInTheDocument();
  });

  it('shows track item count', () => {
    render(<TimelineEditor {...defaultProps} />);
    
    expect(screen.getByText('1 item(s)')).toBeInTheDocument();
  });

  it('shows empty placeholder for empty track', () => {
    render(<TimelineEditor {...defaultProps} />);
    
    expect(screen.getByText('Drop audio files here')).toBeInTheDocument();
  });
});

describe('ZoomControls', () => {
  const defaultProps = {
    zoom: 50,
    duration: 60,
    onZoomChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders zoom controls', () => {
    render(<ZoomControls {...defaultProps} />);
    
    // Should show zoom level percentage
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onZoomChange when zoom in is clicked', () => {
    const onZoomChange = jest.fn();
    render(<ZoomControls {...defaultProps} onZoomChange={onZoomChange} />);
    
    const zoomInBtn = screen.getByTitle('Zoom in');
    fireEvent.click(zoomInBtn);
    
    expect(onZoomChange).toHaveBeenCalledWith(75); // 50 * 1.5
  });

  it('calls onZoomChange when zoom out is clicked', () => {
    const onZoomChange = jest.fn();
    render(<ZoomControls {...defaultProps} onZoomChange={onZoomChange} />);
    
    const zoomOutBtn = screen.getByTitle('Zoom out');
    fireEvent.click(zoomOutBtn);
    
    expect(onZoomChange).toHaveBeenCalled();
    expect(onZoomChange.mock.calls[0][0]).toBeCloseTo(33.33, 1);
  });

  it('calls onZoomChange when fit is clicked', () => {
    const onZoomChange = jest.fn();
    render(<ZoomControls {...defaultProps} onZoomChange={onZoomChange} />);
    
    const fitBtn = screen.getByTitle('Fit to window');
    fireEvent.click(fitBtn);
    
    expect(onZoomChange).toHaveBeenCalled();
  });

  it('calls onZoomChange when reset is clicked', () => {
    const onZoomChange = jest.fn();
    render(<ZoomControls {...defaultProps} zoom={100} onZoomChange={onZoomChange} />);
    
    const resetBtn = screen.getByTitle('Reset zoom');
    fireEvent.click(resetBtn);
    
    expect(onZoomChange).toHaveBeenCalledWith(50);
  });

  it('disables zoom in at max zoom', () => {
    render(<ZoomControls {...defaultProps} zoom={200} />);
    
    const zoomInBtn = screen.getByTitle('Zoom in');
    expect(zoomInBtn).toBeDisabled();
  });

  it('disables zoom out at min zoom', () => {
    render(<ZoomControls {...defaultProps} zoom={10} />);
    
    const zoomOutBtn = screen.getByTitle('Zoom out');
    expect(zoomOutBtn).toBeDisabled();
  });
});

describe('TrackItem', () => {
  const defaultProps = {
    item: {
      id: 'item-1',
      name: 'test-video.mp4',
      path: 'blob:mock-url',
      type: 'video',
      duration: 15,
      startTime: 0,
      thumbnail: null
    },
    index: 0,
    trackId: 'video-track',
    zoom: 50,
    isSelected: false,
    onSelect: jest.fn(),
    onRemove: jest.fn(),
    onReorder: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders item name', () => {
    render(
      <DndWrapper>
        <TrackItem {...defaultProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
  });

  it('renders item duration', () => {
    render(
      <DndWrapper>
        <TrackItem {...defaultProps} />
      </DndWrapper>
    );
    
    // Duration should be formatted as 0:15
    expect(screen.getByText('0:15')).toBeInTheDocument();
  });

  it('shows video icon for video items', () => {
    render(
      <DndWrapper>
        <TrackItem {...defaultProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('🎥')).toBeInTheDocument();
  });

  it('shows image icon for image items', () => {
    const imageItem = {
      ...defaultProps.item,
      type: 'image',
      name: 'test-image.jpg'
    };
    
    render(
      <DndWrapper>
        <TrackItem {...defaultProps} item={imageItem} />
      </DndWrapper>
    );
    
    expect(screen.getByText('🖼️')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(
      <DndWrapper>
        <TrackItem {...defaultProps} onSelect={onSelect} />
      </DndWrapper>
    );
    
    fireEvent.click(screen.getByText('test-video.mp4'));
    
    expect(onSelect).toHaveBeenCalledWith(defaultProps.item);
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    render(
      <DndWrapper>
        <TrackItem {...defaultProps} onRemove={onRemove} />
      </DndWrapper>
    );
    
    const removeBtn = screen.getByTitle('Remove from timeline');
    fireEvent.click(removeBtn);
    
    expect(onRemove).toHaveBeenCalledWith('video-track', 'item-1');
  });

  it('applies selected class when selected', () => {
    const { container } = render(
      <DndWrapper>
        <TrackItem {...defaultProps} isSelected={true} />
      </DndWrapper>
    );
    
    const trackItem = container.querySelector('.track-item');
    expect(trackItem).toHaveClass('selected');
  });

  it('calculates width based on duration and zoom', () => {
    const { container } = render(
      <DndWrapper>
        <TrackItem {...defaultProps} zoom={50} />
      </DndWrapper>
    );
    
    const trackItem = container.querySelector('.track-item');
    // Width = duration * zoom = 15 * 50 = 750px
    expect(trackItem).toHaveStyle({ width: '750px' });
  });

  it('uses minimum width when duration is very short', () => {
    const shortItem = {
      ...defaultProps.item,
      duration: 0.5
    };
    
    const { container } = render(
      <DndWrapper>
        <TrackItem {...defaultProps} item={shortItem} zoom={50} />
      </DndWrapper>
    );
    
    const trackItem = container.querySelector('.track-item');
    // Minimum width is 60px
    expect(trackItem).toHaveStyle({ width: '60px' });
  });
});
