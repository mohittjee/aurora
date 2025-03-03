"use client";

import { useState } from "react";
import { useAudioStore } from "@/store/audioStore";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { List } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card"; // Assuming shadcn/ui
import Image from "next/image";

export default function SongQueue() {
  const { queue, moveTrack, setCurrentTrack } = useAudioStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveTrack(result.source.index, result.destination.index);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <List className="h-6 w-6" />
      </Button>
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-72 bg-gray-100 border rounded shadow-lg max-h-60 overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="queue">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="p-2">
                  {queue.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm">Queue is empty</p>
                  ) : (
                    queue.map((item, index) => {
                      const id = item.videoId || `${item.title}-${item.artist}`;
                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2 cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => {
                                setCurrentTrack(item);
                                setIsOpen(false);
                              }}
                            >
                              <CardContent className="p-2 flex items-center gap-2">
                                <Image
                                  src={item.thumbnails.default.url}
                                  alt={item.title}
                                  width={40}
                                  height={40}
                                  className="rounded"
                                />
                                <div>
                                  <p className="text-sm">{item.title}</p>
                                  <p className="text-xs text-gray-600">{item.artist}</p>
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