import { Card, CardContent } from "@/components/ui/card";
import { YouTubeSearchItem, YouTubePlaylistItem } from "@/types/youtube";

interface QueueItemProps {
  item: YouTubeSearchItem | YouTubePlaylistItem;
  onSelect: () => void;
}

export default function QueueItem({ item, onSelect }: QueueItemProps) {
  return (
    <Card className="mb-2 cursor-pointer" onClick={onSelect}>
      <CardContent className="p-2 flex items-center gap-2">
        <img
          src={item.snippet.thumbnails.default.url}
          alt="Thumbnail"
          className="w-12 h-12 rounded"
        />
        <div>
          <p>{item.snippet.title}</p>
          <p className="text-sm text-gray-600">{item.snippet.channelTitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}