"use client";

import { useAudio } from "@/context/AudioContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import QueueItem from "./QueueItem";

export default function Playlist() {
  const { queue, moveTrack, setCurrentTrack } = useAudio();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveTrack(result.source.index, result.destination.index);
  };

  return (
    <div className="p-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="playlist">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {queue.map((item, index) => (
                <Draggable key={index} draggableId={String(index)} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <QueueItem item={item} onSelect={() => setCurrentTrack(item)} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}