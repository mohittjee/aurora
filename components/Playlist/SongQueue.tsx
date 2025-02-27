"use client";

import { useState } from "react";
import { useAudioStore } from "@/store/audioStore";
import { Button } from "@/components/ui/button";
import { List, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";

export default function SongQueue() {
  const { queue, moveTrack, setCurrentTrack } = useAudioStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveTrack(result.source.index, result.destination.index);
  };

  return (
    <div className="fixed bottom-20 right-4">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <List className="h-6 w-6" />
      </Button>
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-72 bg-gray-100 border rounded shadow-lg max-h-60 overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="queue" direction="vertical">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="p-2"
                >
                  {queue.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm">Queue is empty</p>
                  ) : (
                    queue.map((item, index) => {
                      const uniqueId = item.id?.videoId || item.snippet.resourceId?.videoId || `track-${index}`;
                      return (
                        <Draggable
                          key={uniqueId}
                          draggableId={uniqueId}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`mb-2 cursor-pointer flex items-center ${snapshot.isDragging ? "bg-gray-200" : ""}`}
                              onClick={() => {
                                setCurrentTrack(item);
                                setIsOpen(false);
                              }}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="p-2"
                              >
                                <GripVertical className="h-4 w-4 text-gray-500" />
                              </div>
                              <CardContent className="p-2 flex items-center gap-2 flex-1">
                                <img
                                  src={item.snippet.thumbnails.default.url}
                                  alt="Thumbnail"
                                  className="w-10 h-10 rounded"
                                />
                                <div>
                                  <p className="text-sm">{item.snippet.title}</p>
                                  <p className="text-xs text-gray-600">{item.snippet.channelTitle}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}